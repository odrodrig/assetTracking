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
const Asset = require('../contract/lib/asset');
const AssetLease = require('../contract/lib/assetLease');
const homedir = require('os').homedir();

// A wallet stores a collection of identities for use
const wallet = new FileSystemWallet(homedir+'/.fabric-vscode/local_fabric_wallet/');

// Load connection profile; will be used to locate a gateway
const connectionProfile = JSON.parse(fs.readFileSync('../gateway/connection.json', 'utf8'));

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

    const contract = await network.getContract('asset-tracking');

    /*  
    *   Transaction Inocation section
    * 
    *   We will be replacing the next few lines to invoke different transactions.
    * 
    *   This process follows the following steps:
    * 
    *     1. Submit the transaction 
    *     2. Save the transaction response
    *     3. Parse the response 
    * 
    * 
    */



    
  // End of Trnsaction Invocation section

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