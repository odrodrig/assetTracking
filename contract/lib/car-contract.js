/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

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

        const car = {
            VIN: VIN,
            docType: "Car",
            make: make,
            model: model,
            owner: owner,
            licensePlate: licensePlate,
            mileage: parsedMileage,
            gasLevel: parsedGasLevel,
            currentLocation: currentLocation,
            currentRenter: null,
            currentStatus: "Available"
        }

        const buffer = Buffer.from(JSON.stringify(car));
        await ctx.stub.putState(VIN, buffer);
        return car;
    }    

    async createListing(ctx, listingID, VIN, owner, price) {

        const exists = await this.assetExists(ctx, listingID);

        if (exists) {
            throw new Error(`A listing with listingID "${listingID}" already exists`);
        }

        const parsedPrice = parseFloat(price);

        const listing = {
            "listingID": listingID,
            "docType": "Listing",
            "VIN": VIN,
            "owner": owner,
            "currentPrice": parsedPrice,
            "offers": [],
            "status": "Open"
        }

        const buffer = Buffer.from(JSON.stringify(listing));

        await ctx.stub.putState(listingID, buffer);
        return listing;
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
        return {"VIN": VIN};
    }

    async deleteLease(ctx, leaseID) {
        const exists = await this.assetExists(ctx, leaseID);
        if (!exists) {
            throw new Error(`The lease ${leaseID} does not exist`);
        }
        await ctx.stub.deleteState(leaseID);
        return {"leaseID": leaseID};
    }

    async deleteListing(ctx, listingID) {
        const exists = await this.assetExists(ctx, listingID);
        if (!exists) {
            throw new Error(`The listing with listingID "${listingID}" does not exist`);
        }
        await ctx.stub.deleteState(listingID);
        return {"listingID": listingID};
    }

    async refillGas (ctx, VIN, newGasLevel) {

        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const car = await this.readAsset(ctx, VIN);

        const parsedGasLevel = Number(newGasLevel);

        car.gasLevel = parsedGasLevel;

        const buffer = Buffer.from(JSON.stringify(car));
        await ctx.stub.putState(car.VIN, buffer);

        return car;
    }

    async rentCar(ctx, VIN, leaseID, renter, price, timeRented, restrictions) {

        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const car = await this.readAsset(ctx, VIN);

        if (!car.currentStatus == "Available") {
            throw new Error(`The car ${VIN} is not available to rent`);
        }

        const leaseExists = await this.assetExists(ctx, leaseID);

        if (leaseExists) {
            throw new Error(`The lease ${leaseID} already exists`);
        }

        const parsedPrice = parseFloat(price);

        const lease = {
            "id": leaseID,
            "docType": "Lease",
            "VIN": VIN,
            "renter": renter,
            "owner": car.owner,
            "price": parsedPrice,
            "mileageBefore": car.mileage,
            "timeRented": timeRented,
            "gasAmountBefore": car.gasLevel,
            "restrictions": restrictions    
        }

        car.currentRenter = renter;
        car.currentStatus = "In Use";

        const leaseBuffer = Buffer.from(JSON.stringify(lease));
        const carBuffer = Buffer.from(JSON.stringify(car));


        await ctx.stub.putState(leaseID, leaseBuffer); 
        await ctx.stub.putState(VIN, carBuffer);

        return lease;
    }

    async updateLocation(ctx, VIN, newLocation, gasLevel) {
        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const car = await this.readAsset(ctx, VIN);

        const newGasLevel = Number(gasLevel);

        car.currentLocation = newLocation;
        car.gasLevel = newGasLevel;
        car.mileage+=5;

        const carBuffer = Buffer.from(JSON.stringify(car));
        
        await ctx.stub.putState(VIN, carBuffer);

        return car;
    }

    async returnCar(ctx, leaseID, timeReturned) {
        const exists = await this.assetExists(ctx, leaseID);
        if (!exists) {
            throw new Error(`The lease with ID ${leaseID} does not exist`);
        }

        const lease = await this.readAsset(ctx, leaseID);

        const VIN = lease.VIN;

        const carExists = await this.assetExists(ctx, VIN);
        if (!carExists) {
            throw new Error(`The car with VIN ${VIN} does not exist`);
        }

        const car = await this.readAsset(ctx, VIN);

        const gasAfter = car.gasLevel;
        const milesDriven = car.mileage - lease.mileageBefore;

        if (gasAfter < lease.gasAmountBefore) {
            throw new Error("The amount of gas in the car on return should be equal to or greater then when the car was rented");
        }

        lease.gasAfter = gasAfter;
        lease.milesDriven = milesDriven;
        lease.timeReturned = timeReturned;

        car.currentRenter = null;
        car.currentStatus = "Available";

        const carBuffer = Buffer.from(JSON.stringify(car));
        const leaseBuffer = Buffer.from(JSON.stringify(lease));

        await ctx.stub.putState(car.VIN, carBuffer);
        await ctx.stub.putState(leaseID, leaseBuffer);

        return lease;
    }

    async makeOffer(ctx, listingID, renter, price) {

        const listingExists = this.assetExists(ctx, listingID);
        if(!listingExists) {
            throw new Error(`The listing ${listingID} does not exist`);
        } 
        
        const listing = await this.readAsset(ctx, listingID);

        if(listing.status == "Closed") {
            throw new Error('The listing is already closed');
        }

        const offer = {
            "renter": renter,
            "price": parseFloat(price)
        }

        listing.currentPrice = offer.price;
        listing.offers.push(offer);

        const listingBuffer = Buffer.from(JSON.stringify(listing));

        await ctx.stub.putState(listingID, listingBuffer);
        return listing;
    }

    async acceptOffer(ctx, listingID, leaseID, timeRented, restrictions) {
        const listingExists = await this.assetExists(ctx, listingID);

        if(!listingExists) {
            throw new Error(`The listing ${listingID} does not exist`);
        }

        const listing = await this.readAsset(ctx, listingID);
                
        listing.status = "Closed";

        const lastOffer = listing.offers[listing["offers"].length - 1];

        await this.rentCar(ctx, listing.VIN, leaseID, lastOffer.renter, lastOffer.price, timeRented, restrictions);

        const listingBuffer = Buffer.from(JSON.stringify(listing));

        console.log("just before put listing");
        await ctx.stub.putState(listingID, listingBuffer);
        return listing;
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
