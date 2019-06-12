/*
SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access car-leasing network
 * 4. Determine the transaction that was passed in
 * 5. Submit transaction
 * 6. Process response
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const { FileSystemWallet, Gateway } = require('fabric-network');
const homedir = require('os').homedir();

// A wallet stores a collection of identities for use
const wallet = new FileSystemWallet(homedir+'/.fabric-vscode/local_fabric_wallet/');

// Load connection profile; will be used to locate a gateway
const connectionProfile = JSON.parse(fs.readFileSync('../gateway/connection.json', 'utf8'));

// Parse command line argument
const args = process.argv.slice(2);

// Main program function
async function main() {

  // A gateway defines the peers used to access Fabric networks
  const gateway = new Gateway();

  // Main try/catch block
  try {

    // Set connection options; identity and wallet
    let connectionOptions = {
      identity: "admin",
      wallet: wallet,
      discovery: { enabled:false, asLocalhost: true }
    };

    await gateway.connect(connectionProfile, connectionOptions);

    // Access car-leasing network
    console.log('Use network channel: mychannel.');

    const network = await gateway.getNetwork('mychannel');

    const contract = await network.getContract('car-leasing');

    switch (args[0]) {
      case 'createCar':

        //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
        let createCarResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","john@test.com","123abc","10000","50","1st St. Garage");

        let newCar = JSON.parse(createCarResponse.toString());

        console.log(newCar);

        break;

      case 'createListing':

        //Add the correct parameters below. Reference ../lib/car-contract.js to see what parameters are required
        let createListingResponse = await contract.submitTransaction('createListing', /* Insert arguments here */);

        let newListing = JSON.parse(createListingResponse.toString());

        console.log(newListing);

        break;

      case 'deleteCar':

        //Transaction, VIN
        let deleteCarResponse = await contract.submitTransaction('deleteCar', "123");

        let deletedCar = JSON.parse(deleteCarResponse.toString());

        console.log("Car with VIN : "+deletedCar.VIN+" was deleted");
        break;

      case 'deleteLease':

        //Transaction, leaseID
        let deleteLeaseResponse = await contract.submitTransaction('deleteLease', "Le-001");

        let deletedLease = JSON.parse(deleteLeaseResponse.toString());

        console.log("Lease with leaseID : "+deletedLease.leaseID+" was deleted");
        break;

      case 'deleteListing':

        //Transaction, listingID
        let deleteListingResponse = await contract.submitTransaction('deleteListing', "Li-001");

        let deletedListing = JSON.parse(deleteListingResponse.toString());

        console.log("Listing with listingID : "+deletedListing.listingID+" was deleted");
        break;

      case 'refillGas':

        //Transaction, VIN, newGasLevel 
        let refillGasResponse = await contract.submitTransaction('refillGas', "123","50");

        let afterGas = JSON.parse(refillGasResponse.toString());

        console.log(afterGas);
        break;

      case 'rentCar':

        //Transaction, VIN, leaseID, renter, price, timeRented, restrictions
        let newLeaseResponse = await contract.submitTransaction('rentCar', "123","Le-001","oliver@test.com","15","10:00","Less than 100mi");

        let newLease = JSON.parse(newLeaseResponse.toString());

        console.log(newLease);
        break;

      case 'updateLocation':

        //Transaction, VIN, newLocation, gasLevel
        let updateLocationResponse = await contract.submitTransaction('updateLocation', "123","4th Ave.","40");

        let newCarLocation = JSON.parse(updateLocationResponse.toString());

        console.log(newCarLocation);
        break;

      case 'returnCar':

          //Transaction, leaseID, timeReturned
          let returnCarResponse = await contract.submitTransaction('returnCar', "Le-001","12:00");

          let returnedCar = JSON.parse(returnCarResponse.toString());

          console.log(returnedCar);

        break;

      case 'makeOffer':

        //Transaction, listingID, renter, price
        let makeOfferResponse = await contract.submitTransaction('makeOffer', "Li-001","oliver@test.com","12");

        let newOffer = JSON.parse(makeOfferResponse.toString());

        console.log(newOffer);
        break;

      case 'acceptOffer':

        //Transaction, listingID, leaseID, timeRented, restrictions
        let acceptOfferResponse = await contract.submitTransaction('acceptOffer', "Li-001","Le-001","10:00","Less than 50mi");

        let acceptedOfferLease = JSON.parse(acceptOfferResponse.toString());

        console.log(acceptedOfferLease);
        break;

      case 'queryAll':

          let queryAllResults = await contract.evaluateTransaction('queryAll');
    
          let queryAllArray = JSON.parse(queryAllResults.toString());

          console.log(queryAllArray);      

        break;

      case 'queryByField':

          let queryByFieldResults = await contract.evaluateTransaction('queryByField', 'docType', 'Car');
    
          let queryByFieldArray = JSON.parse(queryByFieldResults.toString());

          console.log(queryByFieldArray);
          
          break;
      
      default:
        throw new Error(`Must include an argument with the name of the transaction you wish to invoke`);
    }

  } catch (error) {

    console.log(`Error processing transaction. ${error}`);
    console.log(error.stack);

  } finally {

    // Disconnect from the gateway
    console.log('Disconnect from Fabric gateway.')
    
    gateway.disconnect();

  }
}
main().then(() => {

  console.log('transaction complete.');


}).catch((e) => {

  console.log('transaction exception.');
  console.log(e);
  console.log(e.stack);
  process.exit(-1);

});