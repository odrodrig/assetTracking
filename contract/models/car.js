// const status = [
//     "Available",
//     "Not Available",
//     "In Use",
// ]

class Car {

    constructor(VIN, make, model, owner, licensePlate, mileage, gasLevel, currentLocation) {        
        this.VIN = VIN;
        this.DocTpye = "Car"
        this.make = make;
        this.model = model;
        this.owner = owner;
        this.licensePlate = licensePlate;
        this.mileage = mileage;
        this.gasLevel = gasLevel;
        this.currentLocation = currentLocation;
        this.currentRenter = null;
        this.currentStatus = 1;
    }

    setMileage(newMileage) {
        this.mileage = newMileage;
    }

    setLocation(newLocation) {
        this.currentLocation = newLocation;
    }

    setGasLevel(newGasLevel) {
        this.gasLevel = newGasLevel;
    }

    setCurrentRenter(newRenter) {
        if(this.currentRenter === null && this.currentStatus == 0) {
            this.currentRenter = newRenter;
        } else {
            throw new Error("Car is currently rented out. Can't rent until car is returned");
        }
    }

    setAvailable() {
        this.currentStatus = 0;
    }

    setNotAvailable() {
        this.currentStatus = 1;
    }

    setInUse() {
        this.currentStatus = 2;
    }

}
module.exports = Car;