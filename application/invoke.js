/*
SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access PaperNet network
 * 4. Construct request to issue commercial paper
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

    // Access PaperNet network
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

        //Transaction, listingID, VIN, owner, price
        let createListingResponse = await contract.submitTransaction('createListing', "Li-001","123","john@test.com","15");

        let newListing = JSON.parse(createListingResponse.toString());

        console.log(newListing);

        break;

      // case 'deleteCar':

      //   //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
      //   let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

      //   let response = JSON.parse(returnResponse.toString());

      //   console.log(response);
      //   break;

      // case 'deleteLease':

      //   //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
      //   let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

      //   let response = JSON.parse(returnResponse.toString());

      //   console.log(response);
      //   break;

      // case 'deleteListing':

      //   //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
      //   let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

      //   let response = JSON.parse(returnResponse.toString());

      //   console.log(response);
      //   break;

      case 'refillGas':

        //Transaction, VIN, newGasLevel 
        let refillGasResponse = await contract.submitTransaction('refillGas', "123","50");

        let afterGas = JSON.parse(refillGasResponse.toString());

        console.log(afterGas);
        break;

      case 'rentCar':

        //Transaction, VIN, leaseID, renter, price, timeRented, restrictions
        let returnResponse = await contract.submitTransaction('rentCar', "123","Le-001","oliver@test.com","15","10:00","Less than 100mi");

        let response = JSON.parse(returnResponse.toString());

        console.log(response);
        break;

      case 'updateLocation':

        //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
        let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

        let response = JSON.parse(returnResponse.toString());

        console.log(response);
        break;

      case 'returnCar':

        //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
        let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

        let response = JSON.parse(returnResponse.toString());

        console.log(response);
        break;

      case 'makeOffer':

        //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
        let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

        let response = JSON.parse(returnResponse.toString());

        console.log(response);
        break;

      case 'acceptOffer':

        //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
        let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

        let response = JSON.parse(returnResponse.toString());

        console.log(response);
        break;

      case 'queryAll':

        break;

      case 'queryByField':

        //Transaction, VIN, Make, Model, User, License Plate, Mileage, Gas Level, current location 
        let returnResponse = await contract.submitTransaction('createCar', "123","Chevy","Tahoe","oliver@test.com","123abc","10000","50","1st St. Garage");

        let response = JSON.parse(returnResponse.toString());

        console.log(response);
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