var koa = require('koa');
var request = require('supertest');
var session = require('./');

describe('Koa Session', function(){
  var cookie;

  describe('when options.signed = true', function(){
    describe('when app.keys are set', function(){
      it('should work', function(done){
        var app = koa();
        app.keys = ['a', 'b'];
        app.use(session());
        app.use(function *(){
          this.session.message = 'hi';
          this.body = this.session;
        });

        request(app.listen())
        .get('/')
        .expect(200, done);
      })
    })

    describe('when app.keys are not set', function(){
      it('should throw', function(done){
        var app = koa();
        app.use(session());
        app.use(function *(){
          this.session.message = 'hi';
          this.body = this.session;
        });

        request(app.listen())
        .get('/')
        .expect(500, done);
      })
    })
  })

  describe('when options.signed = false', function(){
    describe('when app.keys are not set', function(){
      it('should work', function(done){
        var app = koa();
        app.use(session({
          signed: false
        }));
        app.use(function *(){
          this.session.message = 'hi';
          this.body = this.session;
        });

        request(app.listen())
        .get('/')
        .expect(200, done);
      })
    })
  })

  describe('new session', function(){
    describe('when not accessed', function(){
      it('should not Set-Cookie', function(done) {
        var app = App();
        app.use(function *(){
          this.body = 'greetings';
        })
        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        })
      })
    })

    describe('when accessed and not populated', function(done){
      it('should not Set-Cookie', function(done) {
        var app = App();
        app.use(function *(){
          this.session;
          this.body = 'greetings';
        })
        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        })
      })
    })

    describe('when populated', function(done){
      it('should Set-Cookie', function(done){
        var app = App();
        app.use(function *(){
          this.session.message = 'hello';
          this.body = '';
        })
        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /koa:sess/)
        .expect('Set-Cookie', /hello/)
        .expect(200, function(err, res){
          if (err) return done(err);
          cookie = res.header['set-cookie'].join(';');
          done();
        })
      })

      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function *(){
          this.body = this.session;
        })
        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        })
      })
    })
  })

  describe('saved session', function(){
    describe('when not accessed', function(){
      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function *(){
          this.body = 'aklsdjflasdjf';
        })
        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, function(err, res){
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        })
      })
    })

    describe('when accessed but not changed', function(){
      it('should be the same session', function(done){
        var app = App();
        app.use(function *(){
          this.session.message.should.equal('hello');
          this.body = 'aklsdjflasdjf';
        })
        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, done);
      })

      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function *(){
          this.session.message.should.equal('hello');
          this.body = 'aklsdjflasdjf';
        })
        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, function(err, res){
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        })
      })
    })

    describe('when accessed and changed', function(){
      it('should Set-Cookie', function(done){
        var app = App();
        app.use(function *(){
          this.session.money = '$$$';
          this.body = 'aklsdjflasdjf';
        })
        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect('Set-Cookie', /money/)
        .expect(200, done);
      })
    })
  })

  describe('when session = ', function(){
    describe('null', function(){
      it('should expire the session', function(done){
        var app = App();
        app.use(function *(){
          this.session = null;
          this.body = 'asdf';
        })
        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /expire/)
        .expect(200, done);
      })
    })

    describe('{}', function(){
      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function *(){
          this.session = {};
          this.body = 'asdf';
        })
        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          res.header.should.not.have.property('set-cookie');
          done();
        });
      })
    })

    describe('{a: b}', function(){
      it('should create a session', function(done){
        var app = App();
        app.use(function *(){
          this.session = { message: 'hello' };
          this.body = 'asdf';
        })
        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /hello/)
        .expect(200, done);
      })
    })

    describe('anything else', function(){
      it('should throw', function(done){
        var app = App();
        app.use(function *(){
          this.session = 'asdf'
        })
        request(app.listen())
        .get('/')
        .expect(500, done);
      })
    })
  })
})

function App(options) {
  var app = koa();
  app.keys = ['a', 'b'];
  app.use(session(options));
  return app;
}