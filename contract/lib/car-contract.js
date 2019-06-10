/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const Car = require('../models/car.js');
const Lease = require('../models/lease.js');
const User = require('../models/user.js');
const Company = require('../models/company.js');
const Listing = require('../models/listing.js');

class CarContract extends Contract {

    async assetExists(ctx, VIN) {
        const buffer = await ctx.stub.getState(VIN);
        return (!!buffer && buffer.length > 0);
    }

    async createCar(ctx, VIN, make, model, owner, licensePlate, mileage, gasLevel, currentLocation) {
        const exists = await this.assetExists(ctx, VIN);
        if (exists) {
            throw new Error(`The car ${VIN} already exists`);
        }

        const parsedMileage = Number(mileage);
        const parsedGasLevel = Number(gasLevel);

        const car = new Car(VIN, make, model, owner, licensePlate, parsedMileage, parsedGasLevel, currentLocation);
        const buffer = Buffer.from(JSON.stringify(car));
        await ctx.stub.putState(VIN, buffer);
    }

    async createUser(ctx, email, firstName, lastName, phone, driversLicense) {

        const exists = await this.assetExists(ctx, email);
        if (exists) {
            throw new Error(`A user with the eamil "${email}" already exists`);
        }

        const user = new User(email, firstName, lastName, phone, driversLicense);

        const buffer = Buffer.from(JSON.stringify(user));

        await ctx.stub.putState(email, buffer);
    }

    async createCompany(ctx, companyID, companyName, phone) {

        const exists = await this.assetExists(ctx, companyID);
        if (exists) {
            throw new Error(`A company with companyID "${companyID}" already exists`);
        }

        const company = new Company(companyID, companyName, phone);

        const buffer = Buffer.from(JSON.stringify(company));

        await ctx.stub.putState(email, buffer);
    }

    async createListing(ctx, listingID, VIN, ownerEmail, price) {

        const exists = await this.assetExists(ctx, listingID);

        if (exists) {
            throw new Error(`A listing with listingID "${listingID}" already exists`);
        }

        const parsedPrice = parseFloat(price);

        const listing = new Listing(listingID, VIN, ownerEmail, parsedPrice);
        const buffer = Buffer.from(JSON.stringify(listing));

        await ctx.stub.putState(listingID, buffer);
    }

    async readAsset(ctx, ID) {
        const exists = await this.assetExists(ctx, ID);
        if (!exists) {
            throw new Error(`The asset ${ID} does not exist`);
        }
        const buffer = await ctx.stub.getState(ID);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    async deleteCar(ctx, VIN) {
        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }
        await ctx.stub.deleteState(VIN);
    }

    async deleteLease(ctx, leaseID) {
        const exists = await this.assetExists(ctx, leaseID);
        if (!exists) {
            throw new Error(`The lease ${leaseID} does not exist`);
        }
        await ctx.stub.deleteState(leaseID);
    }

    async deleteUser(ctx, email) {
        const exists = await this.assetExists(ctx, email);
        if (!exists) {
            throw new Error(`The User with email "${email}" does not exist`);
        }
        await ctx.stub.deleteState(email);
    }

    async deleteCompany(ctx, companyID) {
        const exists = await this.assetExists(ctx, companyID);
        if (!exists) {
            throw new Error(`The company with companyID "${companyID}" does not exist`);
        }
        await ctx.stub.deleteState(companyID);
    }

    async deleteListing(ctx, listingID) {
        const exists = await this.assetExists(ctx, listingID);
        if (!exists) {
            throw new Error(`The listing with listingID "${listingID}" does not exist`);
        }
        await ctx.stub.deleteState(listingID);
    }

    async refillGas (ctx, VIN, newGasLevel) {

        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const carJSON = await this.readAsset(ctx, VIN);
        const car = new Car(carJSON);

        const parsedGasLevel = Number(newGasLevel);

        car.setGasLevel(parsedGasLevel)
        .then(() => {

            const buffer = Buffer.from(JSON.stringify(car));
            ctx.stub.putState(buffer);

        })
        .catch((e) => {
            console.log(e);
            throw new Error(`The car ${VIN} could not be updated`);
        });

    }

    async rentCar(ctx, VIN, leaseID, renter, price, timeRented, restrictions) {

        console.log("in rent");

        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const carJSON = await this.readAsset(ctx, VIN);
        const car = new Car(carJSON); 

        console.log(car);

        console.log("got car");

        if (!car.currentStatus == 0) {
            throw new Error(`The car ${VIN} is not available to rent`);
        }

        const exists = await this.assetExists(ctx, leaseID);

        if (exists) {
            throw new Error(`The lease ${leaseID} already exists`);
        }

        const parsedPrice = parseFloat(price);

        console.log("before creating lease");

        const lease = new Lease(leaseID, car, renter, car.owner, parsedPrice, car.mileage, timeRented, car.gasLevel, restrictions);

        car.setInUse();

        console.log("before buffers");

        const leaseBuffer = Buffer.from(JSON.stringify(lease));
        const carBuffer = Buffer.from(JSON.stringify(car));


        console.log("before lease put");
        await ctx.stub.putState(leaseID, leaseBuffer); 
        console.log("before car put");
        await ctx.stub.putState(VIN, carBuffer);
    }

    async updateLocation(ctx, VIN, newLocation, gasLevel) {
        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const carJSON = await this.readAsset(ctx, VIN);
        const car = new Car(carJSON);

        const newGasLevel = Number(gasLevel);

        car.currentLocation = newLocation;
        car.gasLevel = newGasLevel;

        const carBuffer = Buffer.from(JSON.stringify(car));
        
        await ctx.stub.putState(VIN, carBuffer);
    }

    async returnCar(ctx, leaseID, timeReturned) {
        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const leaseJSON= await this.readAsset(ctx, leaseID);
        const lease = new Lease(leaseJSON);

        const VIN = lease.VIN;

        const carJSON = await this.readAsset(ctx, VIN);
        const car = new Car(carJSON);

        const gasAfter = car.gasLevel;
        const milesDriven = car.mileage - lease.mileageBefore;

        if (gasAfter < lease.gasAmountBefore) {
            throw new Error("The amount of gas in the car on return should be equal to or greater then when the car was rented");
        }

        lease.setGasAfter(gasAfter);
        lease.setMilesDriven(milesDriven);
        lease.setTimeReturned(timeReturned);

        car.setMileage(milesDriven);
        car.setCurrentRenter(null);
        car.setAvailable();

        const carBuffer = Buffer.from(JSON.stringify(car));
        const leaseBuffer = Buffer.from(JSON.stringify(lease));

        await ctx.stub.putState(car.VIN, carBuffer);
        await ctx.stub.putState(lease.leaseID, leaseBuffer);

    }

    async makeOffer(ctx, listingID, renter, price) {

        const listingExists = this.assetExists(ctx, listingID);
        if(!listingExists) {
            throw new Error(`The listing ${listingID} does not exist`);
        }  
        
        const listingJSON = await this.readAsset(ctx, listingID);
        const listing = new Listing(listingJSON);

        const offer = {
            "renter": renter,
            "price": parseFloat(price)
        }

        listing.setCurrentPrice(offer.price);
        listing.addOffer(offer);

        const listingBuffer = Buffer.from(JSON.stringify(listing));

        await ctx.stub.putState(listingID, listingBuffer);
    }

    async acceptOffer(ctx, listingID, leaseID, timeRented, restrictions) {
        const listingExists = await this.assetExists(ctx, listingID);

        if(!listingExists) {
            throw new Error(`The listing ${listingID} does not exist`);
        }

        console.log("before listing json");
        const listingJSON = await this.readAsset(ctx, listingID);
        const listing = new Listing(listingJSON);
        console.log(listing);

        console.log("before carjson");
        console.log(listing.VIN);
        
        const carJSON = await this.readAsset(ctx, listing.VIN);
        console.log(carJSON);
        console.log("after carjson");
        
        const car = new Car(carJSON);

        listing.setClosed();

        const lastOffer = Listing.getLastOffer();

        console.log("just before rent");
        await this.rentCar(ctx, listing.VIN, leaseID, lastOffer.renter, lastOffer.price, timeRented, car.gasLevel, restrictions);

        const listingBuffer = Buffer.from(JSON.stringify(listing));

        console.log("just before put listing");
        await ctx.stub.putState(listingID, listingBuffer);
    }

    // Query All assets in the ledger
    async queryAll(ctx) {

        // Query the state database with query string. An empty selector returns all documents.
        const iterator = await ctx.stub.getQueryResult('{ "selector": {} }');

        const allResults = [];

        // Loop through iterator and parse all results
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

    async queryByField(ctx, field, value) {
         // Query the state database with query string.
        // In the query string we pass in the field to filter by and the value of that field
        const iterator = await ctx.stub.getQueryResult('{ "selector": { "'+field+'": "'+value+'"} }');

        const allResults = [];

        // Loop through iterator and parse all results
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }

}

module.exports = CarContract;
