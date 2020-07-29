'use strict';

const CargoBuilder = require('../src/CargoBuilder');

describe('CargoBuilder', () => {
  const serverlessMock = {
    cli: {
      log: () => {},
    },
    utils: {},
  };

  it('should create CargoBuilder', () => {
    const builder = new CargoBuilder(serverlessMock);
    expect(builder).toBeTruthy();
  });
});
