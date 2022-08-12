const app = require('../app.js');

describe('Index', () => {
    test('jest is install properly', () => {});

    test('should retrieve dataBike', () => {
        console.log(app)
        expect(app.dataBike).toBeDefined()
    });

});