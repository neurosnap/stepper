var Stepper = require('../stepper.dev');

var sp = new Stepper();

sp.on('beforeBegin', function() { console.log('before begin'); })
  .on('begin', function() { console.log('step began'); })
  .on('end', function() { console.log('step done'); })
  .on('allEnd', function() { console.log('all done'); })
  .on('error', function(err, step) {
    console.log(err);
    console.log(step);
  });

var first_step = sp.use(function(next) {
  console.log('sup bitch');
  next();
});

var second_step = sp.use(function(next) {
  console.log('second step better fail');
  next('Your shit is jacked homie');
}).on('error', function(err) {
  console.log(err);
});

console.log('===================');

var pp = new Stepper({}, function(next) {
  console.log('step 1');
  next();
}, sp, function(next) {
  console.log('step 2');
  next();
}).run();

console.log(pp.status);

var second_step = pp.get(1);
second_step.status;

console.log(second_step);
