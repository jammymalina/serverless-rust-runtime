'use strict';

const CargoBuilder = require('../src/CargoBuilder');
const serverlessMock = require('./serverlessMock');

describe('CargoBuilder', () => {
  it('should create CargoBuilder', () => {
    const builder = new CargoBuilder(serverlessMock);
    expect(builder).toBeTruthy();
  });
});
