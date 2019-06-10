class User {
    
    constructor(email, firstName, lastName, phone, driversLicense) {
        this.email = email;
        this.DocType = "User";
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.driversLicense = driversLicense;
    }

}

module.exports = User;