class Lease {

    constructor(leaseID, VIN, renter, owner, price, milesBefore, timeRented, gasAmountBefore, restrictions) {
        this.id = leaseID;
        this.DocType = "Lease";
        this.VIN = VIN;
        this.renter = renter;
        this.owner = owner;
        this.price = price;
        this.mileageBefore = milesBefore;
        this.timeRented = timeRented;
        this.gasAmountBefore = gasAmountBefore;
        this.restrictions = restrictions;
    }

    setGasAfter(gasLevel) {
        this.gasAmountAfter = gasLevel;
    }

    setMilesDriven(miles) {
        this.milesDriven = miles;
    }

    setTimeReturned(timeReturned) {
        this.timeReturned = timeReturned;
    }

    

}

module.exports = Lease;