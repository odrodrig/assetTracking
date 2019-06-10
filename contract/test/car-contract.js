/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { CarContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('CarContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new CarContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"car 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"car 1002 value"}'));
    });

    describe('#carExists', () => {

        it('should return true for a car', async () => {
            await contract.carExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a car that does not exist', async () => {
            await contract.carExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createCar', () => {

        it('should create a car', async () => {
            await contract.createCar(ctx, '1003', 'car 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"car 1003 value"}'));
        });

        it('should throw an error for a car that already exists', async () => {
            await contract.createCar(ctx, '1001', 'myvalue').should.be.rejectedWith(/The car 1001 already exists/);
        });

    });

    describe('#readCar', () => {

        it('should return a car', async () => {
            await contract.readCar(ctx, '1001').should.eventually.deep.equal({ value: 'car 1001 value' });
        });

        it('should throw an error for a car that does not exist', async () => {
            await contract.readCar(ctx, '1003').should.be.rejectedWith(/The car 1003 does not exist/);
        });

    });

    describe('#updateCar', () => {

        it('should update a car', async () => {
            await contract.updateCar(ctx, '1001', 'car 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"car 1001 new value"}'));
        });

        it('should throw an error for a car that does not exist', async () => {
            await contract.updateCar(ctx, '1003', 'car 1003 new value').should.be.rejectedWith(/The car 1003 does not exist/);
        });

    });

    describe('#deleteCar', () => {

        it('should delete a car', async () => {
            await contract.deleteCar(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a car that does not exist', async () => {
            await contract.deleteCar(ctx, '1003').should.be.rejectedWith(/The car 1003 does not exist/);
        });

    });

});