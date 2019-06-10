// const status = [
//     "Open",
//     "Closed"
// ]

class Listing {
    
    constructor (listingID, VIN, owner, price) {
        this.listingID = listingID;
        this.docType = "Listing";
        this.VIN = VIN;
        this.owner = owner;
        this.currentPrice = price;
        this.offers = [];
        this.status = 0;
    }

    setCurrentPrice(price) {

        if(this.status != 0) {
            throw new Error(`Listing is already closed`);
        }

        this.currentPrice = price;
    }

    addOffer(offer) {

        if(this.status != 0) {
            throw new Error(`Listing is already closed`);
        }

        this.offers.push(offer);
    }   

    getLastOffer() {
        return this.offers[listing["offers"].length - 1];
    }

    setOpen() {
        this.status = 0;
    }

    setClosed() {
        this.status = 1;
    }

}



module.exports = Listing;