/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class CarContract extends Contract {

    // Checks to see if an asset exists 
    async assetExists(ctx, id) {
        const buffer = await ctx.stub.getState(id);
        return (!!buffer && buffer.length > 0);
    }

    // Creates a car object
    async createCar(ctx, VIN, make, model, owner, licensePlate, mileage, gasLevel, currentLocation) {
        const exists = await this.assetExists(ctx, VIN);
        if (exists) {
            throw new Error(`The car ${VIN} already exists`);
        }

        const parsedMileage = Number(mileage);
        const parsedGasLevel = Number(gasLevel);

        // Creating the car object from the arguments passed into the createCar transaction
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

        // A buffer of the car object is made. This the required data type for committing to the ledger
        const buffer = Buffer.from(JSON.stringify(car));

        // The putState method stores the buffer in the world state at the key indicated by the VIN
        await ctx.stub.putState(VIN, buffer);

        // The car object is returned to the application that is invoking this transaction
        return car;
    }    

    // Creates a listing for a car that allows for people to submit offers for different rental prices
    async createListing(ctx, listingID, VIN, owner, price) {

        const exists = await this.assetExists(ctx, listingID);

        if (exists) {
            throw new Error(`A listing with listingID "${listingID}" already exists`);
        }

        const parsedPrice = parseFloat(price);

        // Create a listing object from the arguments passed into the transaction
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

    // Reads the asset from the world state based on the ID passed in to the transaction and returns the asset object
    async readAsset(ctx, ID) {
        const exists = await this.assetExists(ctx, ID);
        if (!exists) {
            throw new Error(`The asset ${ID} does not exist`);
        }
        const buffer = await ctx.stub.getState(ID);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    // Deletes a car from the world state. 
    async deleteCar(ctx, VIN) {
        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        // deleteState just removes the asset from the world state. The asset will still exist in transactions in the blockchain but will be removed from the world state.
        await ctx.stub.deleteState(VIN);

        // Return the VIN of the deleted car back to the application invoking the transaction
        return {"VIN": VIN};
    }

    // Deletes a lease from the world state
    async deleteLease(ctx, leaseID) {
        const exists = await this.assetExists(ctx, leaseID);
        if (!exists) {
            throw new Error(`The lease ${leaseID} does not exist`);
        }
        await ctx.stub.deleteState(leaseID);
        return {"leaseID": leaseID};
    }

    // Deletes a listing from the world state
    async deleteListing(ctx, listingID) {
        const exists = await this.assetExists(ctx, listingID);
        if (!exists) {
            throw new Error(`The listing with listingID "${listingID}" does not exist`);
        }
        await ctx.stub.deleteState(listingID);
        return {"listingID": listingID};
    }

    // Updates the gas level of a car
    async refillGas (ctx, VIN, newGasLevel) {

        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const car = await this.readAsset(ctx, VIN);

        const parsedGasLevel = Number(newGasLevel);

        // Set the new gas level based on what was passed in
        car.gasLevel = parsedGasLevel;

        const buffer = Buffer.from(JSON.stringify(car));
        await ctx.stub.putState(car.VIN, buffer);

        return car;
    }

    // Starts the rental process and creates a new lease
    async rentCar(ctx, VIN, leaseID, renter, price, timeRented, restrictions) {

        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        // Fetches the car from the world state by using the readAsset transaction from this contract
        const car = await this.readAsset(ctx, VIN);

        // Check to see if the car being requested is avilalbe. If not, throw an error.
        if (!car.currentStatus == "Available") {
            throw new Error(`The car ${VIN} is not available to rent`);
        }

        const leaseExists = await this.assetExists(ctx, leaseID);

        if (leaseExists) {
            throw new Error(`The lease ${leaseID} already exists`);
        }

        const parsedPrice = parseFloat(price);

        // Create a lease object based on the aruments passed in to the transaction.
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

        // Set the currentRenter of the car
        car.currentRenter = renter;

        // Set the currentState of the car. This will prevent the car from being leased out while someone has already rented it.
        car.currentStatus = "In Use";

        const leaseBuffer = Buffer.from(JSON.stringify(lease));
        const carBuffer = Buffer.from(JSON.stringify(car));

        // Store the new lease and the updated car in the world state
        await ctx.stub.putState(leaseID, leaseBuffer); 
        await ctx.stub.putState(VIN, carBuffer);

        // Return the new lease to the application that is invoking the transaction
        return lease;
    }

    // Updates the current location of a car. Also takes periodic readings of the gas level
    async updateLocation(ctx, VIN, newLocation, gasLevel) {
        const exists = await this.assetExists(ctx, VIN);
        if (!exists) {
            throw new Error(`The car ${VIN} does not exist`);
        }

        const car = await this.readAsset(ctx, VIN);

        const newGasLevel = Number(gasLevel);

        // Set the current location and gas level
        car.currentLocation = newLocation;
        car.gasLevel = newGasLevel;

        // For the purose of the demo, increase mileage
        car.mileage+=5;

        const carBuffer = Buffer.from(JSON.stringify(car));
        
        await ctx.stub.putState(VIN, carBuffer);

        return car;
    }

    // Records important trip information in the lease and applies any fees that have been incurred.
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

        // Set gas level at the moment the car is returned
        const gasAfter = car.gasLevel;

        // Determine the number of miles driven
        const milesDriven = car.mileage - lease.mileageBefore;

        // If the car is returned with less gas than when it was rented. Apply a penalty fee to the final price of the lease.
        if (gasAfter < lease.gasAmountBefore) {
            console.log("Gas level upon return is less than when leased. A $50 charge has been applied to the overall price");
            lease.price += 50;
        }

        // Set trip information in the lease
        lease.gasAfter = gasAfter;
        lease.milesDriven = milesDriven;
        lease.timeReturned = timeReturned;

        // Remove the currentRenter from the car and mark car as available
        car.currentRenter = null;
        car.currentStatus = "Available";

        const carBuffer = Buffer.from(JSON.stringify(car));
        const leaseBuffer = Buffer.from(JSON.stringify(lease));

        await ctx.stub.putState(car.VIN, carBuffer);
        await ctx.stub.putState(leaseID, leaseBuffer);

        return lease;
    }

    // Make an offer on a car listing
    async makeOffer(ctx, listingID, renter, price) {

        const listingExists = this.assetExists(ctx, listingID);
        if(!listingExists) {
            throw new Error(`The listing ${listingID} does not exist`);
        } 
        
        const listing = await this.readAsset(ctx, listingID);

        // Throw an error if an offer has already been accepted and the listing is closed
        if(listing.status == "Closed") {
            throw new Error('The listing is already closed');
        }

        // Create an offer object based on the arguments passed in
        const offer = {
            "renter": renter,
            "price": parseFloat(price)
        }

        // Add the new offer to the array of offers in the listing
        listing.offers.push(offer);

        const listingBuffer = Buffer.from(JSON.stringify(listing));

        await ctx.stub.putState(listingID, listingBuffer);
        return listing;
    }

    // Accept an offer made on a listing
    async acceptOffer(ctx, listingID, leaseID, timeRented, restrictions) {
        const listingExists = await this.assetExists(ctx, listingID);

        if(!listingExists) {
            throw new Error(`The listing ${listingID} does not exist`);
        }

        const listing = await this.readAsset(ctx, listingID);
        
        // For demo purposes, this transaction makes the assumption that the last offer received is the best offer.
        // Get the last offer received.
        const lastOffer = listing.offers[listing["offers"].length - 1];

        // Set the listing's current price to the price given in the last offer and close the listing so no other offers are made
        listing.currentPrice = lastOffer.price;
        listing.status = "Closed";

        // Call the rentCar transaction in the contract to start the rental process and create a lease agreement
        await this.rentCar(ctx, listing.VIN, leaseID, lastOffer.renter, lastOffer.price, timeRented, restrictions);

        const listingBuffer = Buffer.from(JSON.stringify(listing));

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
