const chai = require('chai');
const sinon = require('sinon');
const amqp = require('amqplib/callback_api');
const expect = chai.expect;
const Usuario = require('../models/Usuario');


const { add } = require('../controllers/usuariosController');
const { getAll } = require('../controllers/usuariosController');


describe('add()', function() {
    let req, res, findOneStub, saveStub, amqpConnectStub, channelMock, connectionMock;

    beforeEach(function() {
        req = {
            body: {
                nombre: 'Test User',
                correo: 'test@example.com',
                contraseña: 'password123',
                rol: 'user',
                idioma: 'es'
            }
        };

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        // Mock Usuario.findOne y Usuario.prototype.save
        findOneStub = sinon.stub(Usuario, 'findOne');
        saveStub = sinon.stub(Usuario.prototype, 'save');

        // Mock de RabbitMQ
        channelMock = {
            assertExchange: sinon.stub(),
            publish: sinon.stub()
        };

        connectionMock = {
            createChannel: sinon.stub().callsFake(cb => cb(null, channelMock)),
            close: sinon.stub()
        };

        amqpConnectStub = sinon.stub(amqp, 'connect').callsFake((url, cb) => cb(null, connectionMock));
    });

    afterEach(function() {
        sinon.restore();
    });

    it('debe regresar 400 si faltan campos', async function() {
        req.body = {}; // campos vacíos

        await add(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error' })).to.be.true;
    });

    it('debe regresar 409 si el correo ya existe', async function() {
        findOneStub.resolves({ correo: 'test@example.com' }); // usuario ya existe

        await add(req, res);

        expect(res.status.calledWith(409)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error', message: 'Correo ya registrado' })).to.be.true;
    });

    it('debe crear un usuario nuevo y publicar en RabbitMQ', async function() {
        findOneStub.resolves(null); // no existe usuario
        saveStub.resolves(); // simula que guarda correctamente

        await add(req, res);

        expect(res.json.calledWithMatch({ response: 'success' })).to.be.true;
        expect(amqpConnectStub.calledOnce).to.be.true;
        expect(channelMock.assertExchange.calledOnce).to.be.true;
        expect(channelMock.publish.calledOnce).to.be.true;
    });

    it('debe manejar errores y responder 500', async function() {
        findOneStub.rejects(new Error('DB error')); // forzar error

        await add(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error' })).to.be.true;
    });
});

describe('getAll()', function() {
    let req, res, findStub;

    beforeEach(function() {
        req = {}; // no necesitamos nada en req para este caso

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        findStub = sinon.stub(Usuario, 'find');
    });

    afterEach(function() {
        sinon.restore();
    });

    it('debe regresar una lista de usuarios', async function() {
        const usuariosFalsos = [
            { nombre: 'Usuario 1', correo: 'u1@example.com', rol: 'admin' },
            { nombre: 'Usuario 2', correo: 'u2@example.com', rol: 'user' }
        ];

        findStub.resolves(usuariosFalsos);

        await getAll(req, res);

        expect(findStub.calledOnceWith({}, 'nombre correo rol')).to.be.true;
        expect(res.json.calledWith(usuariosFalsos)).to.be.true;
    });

    it('debe manejar errores y responder 500', async function() {
        findStub.rejects(new Error('Error en la base de datos'));

        await getAll(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error' })).to.be.true;
    });
});