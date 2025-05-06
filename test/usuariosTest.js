const chai = require('chai');
const sinon = require('sinon');
const amqp = require('amqplib/callback_api');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
chai.use(chaiHttp);


const { add } = require('../controllers/usuariosController');
const { getAll } = require('../controllers/usuariosController');
const { update } = require('../controllers/usuariosController');
const { remove } = require('../controllers/usuariosController');
const { login } = require('../controllers/usuariosController');

describe('add()', function() {
    let req, res, findOneStub, saveStub, amqpConnectStub, channelMock, connectionMock;

    beforeEach(function() {
        req = {
            body: {
                nombre: 'Test User',
                correo: 'test@example.com',
                contraseña: 'password123',
                rol: 'Estudiante',
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
    /** 
    it('debe manejar errores y responder 500', async function() {
        findOneStub.rejects(new Error('DB error')); // forzar error

        await add(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error' })).to.be.true;
    });
    */
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
    /** 
    it('debe manejar errores y responder 500', async function() {
        findStub.rejects(new Error('Error en la base de datos'));

        await getAll(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error' })).to.be.true;
    });
    */
});

describe('update()', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: { id: '1234567890' },
            body: {}
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('debe devolver 400 si no se envía ningún campo', async () => {
        await update(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error' })).to.be.true;
    });

    it('debe devolver 404 si el usuario no existe', async () => {
        req.body = { nombre: 'Nuevo Nombre' };
        sinon.stub(Usuario, 'findByIdAndUpdate').resolves(null);

        await update(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Usuario no encontrado' })).to.be.true;
    });

    it('debe devolver el usuario actualizado si se encuentra', async () => {
        req.body = { nombre: 'Actualizado', correo: 'nuevo@correo.com' };
        const fakeUser = { _id: '123', nombre: 'Actualizado', correo: 'nuevo@correo.com', rol: 'Estudiante', idioma: 'es' };

        sinon.stub(Usuario, 'findByIdAndUpdate').resolves(fakeUser);

        await update(req, res);

        expect(res.json.calledWithMatch({ response: 'success', updated: fakeUser })).to.be.true;
    });
    /** 
    it('debe manejar errores internos con 500', async () => {
        req.body = { nombre: 'ErrorNombre' };
        sinon.stub(Usuario, 'findByIdAndUpdate').throws(new Error('Fallo grave'));

        await update(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error', message: 'Fallo grave' })).to.be.true;
    });
    */
});

describe('Controlador Usuarios - remove()', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: { id: '1234567890' }
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('debe devolver 404 si el usuario a eliminar no existe', async () => {
        sinon.stub(Usuario, 'findByIdAndDelete').resolves(null);

        const { remove } = require('../controllers/usuariosController');
        await remove(req, res);

        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error', message: 'Usuario no encontrado' })).to.be.true;
    });

    it('debe devolver el usuario eliminado si existe', async () => {
        const fakeUser = { _id: '123', nombre: 'Usuario Eliminado' };
        sinon.stub(Usuario, 'findByIdAndDelete').resolves(fakeUser);

        const { remove } = require('../controllers/usuariosController');
        await remove(req, res);

        expect(res.json.calledWithMatch({ response: 'success', deleted: fakeUser })).to.be.true;
    });
    /** 
    it('debe manejar errores internos con 500', async () => {
        sinon.stub(Usuario, 'findByIdAndDelete').throws(new Error('Error de base de datos'));

        const { remove } = require('../controllers/usuariosController');
        await remove(req, res);

        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWithMatch({ response: 'error', message: 'Error de base de datos' })).to.be.true;
    });
    */
});

describe('Controlador Usuarios - login()', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('debe devolver 400 si faltan correo o contraseña', async () => {
        req.body = { correo: '' };

        await login(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Correo y contraseña son obligatorios' })).to.be.true;
    });

    it('debe devolver 401 si el usuario no existe', async () => {
        req.body = { correo: 'test@mail.com', contraseña: '123' };
        sinon.stub(Usuario, 'findOne').resolves(null);

        await login(req, res);

        expect(res.status.calledWith(401)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Correo o contraseña incorrectos' })).to.be.true;
    });

    it('debe devolver 401 si la contraseña es incorrecta', async () => {
        req.body = { correo: 'test@mail.com', contraseña: '123' };
        sinon.stub(Usuario, 'findOne').resolves({ correo: 'test@mail.com', contraseña: 'hashed' });
        sinon.stub(bcrypt, 'compare').resolves(false);

        await login(req, res);

        expect(res.status.calledWith(401)).to.be.true;
        expect(res.json.calledWithMatch({ message: 'Correo o contraseña incorrectos' })).to.be.true;
    });

    it('debe devolver token y usuario si el login es exitoso', async () => {
        req.body = { correo: 'test@mail.com', contraseña: '123' };
        const fakeUser = {
            _id: '1',
            nombre: 'Test',
            correo: 'test@mail.com',
            rol: 'Estudiante',
            idioma: 'es',
            contraseña: 'hashed'
        };

        sinon.stub(Usuario, 'findOne').resolves(fakeUser);
        sinon.stub(bcrypt, 'compare').resolves(true);
        sinon.stub(jwt, 'sign').returns('fake.jwt.token');
        
        // Simula amqp.connect sin hacer conexión real
        sinon.stub(amqp, 'connect').callsFake((_, cb) => {
            cb(null, {
                createChannel: cb2 => cb2(null, {
                    assertExchange: () => {},
                    publish: () => {},
                }),
                close: () => {}
            });
        });

        await login(req, res);

        expect(res.json.calledOnce).to.be.true;
        expect(res.json.firstCall.args[0]).to.have.property('token', 'fake.jwt.token');
        expect(res.json.firstCall.args[0].usuario).to.include({
            nombre: 'Test',
            correo: 'test@mail.com',
            rol: 'Estudiante',
            idioma: 'es'
        });
    });

});