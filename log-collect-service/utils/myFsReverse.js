let fs = require('fs');
let Stream = require('stream');

module.exports = function (file, opts) {
  let matcher = opts && opts.matcher || '\n';
  let bufferSize = opts && opts.bufferSize || 1024 * 64;
  let mode = opts && opts.mode || 438 // 0666;
  let flags = opts && opts.flags || 'r';

  if(!/rx?/.test(flags)) throw new Error("only flags 'r' and 'rx' are allowed");

  let stream = new Stream();
  stream.ended = false;
  stream.started = false;
  stream.readable = true;
  stream.writable = false;
  stream.paused = false;
  stream.ended = false;
  stream.pause = function () {
    stream.started = true;
    stream.paused = true;
  }; 

  let soFar = '';
  let stat, fd, position;

  function onError (err) {
    stream.emit('error', err);
    stream.destroy();
  }

  let i = 0;
  function next () {
    stream.started = true;
    if(stream.ended) return;
    while(!stream.ended && !stream.paused && getChunk(i++, function () {
      if(!stream.ended && !stream.paused)
          process.nextTick(next);
    }));
  }

  stream.resume = function () {
    stream.started = true;
    stream.paused = false;
    next();
  }
  
  stream.on('end', function () {
    stream.ended = true;
    stream.readable = false;
    process.nextTick(stream.destroy);
  });


  function getChunk(count, next) {
    if(stream.destroyed) 
      return;

    if(count === 0) {
      var c = 2;
      fs.stat(file, function (err, _stat) {
        if(err) return onError(err);
        stat = _stat;
        position = stat.size;
        if(!--c) read();
      });
      fs.open(file, flags, mode, function (err, _fd) {
        if(err) return onError(err);
        fd = _fd;
        stream.emit('open');
        if(!--c) read();
      })
    } else {
      read();
    }

    function read () {
      if(stream.destroyed) {
        return;
      }

      let length = Math.min(bufferSize, position);
      let b = Buffer.alloc(length);
      position = position - length;
      fs.read(fd, b, 0, length, position, function (err) {
        if(err) {
          return onError(err);
        }

        parseBufferData(b);
        if(position > 0) {
          return next();
        }
        stream.emit('data', soFar);
        stream.emit('end');
        stream.destroy();
      });
    }

    function parseBufferData(buffer) {
      soFar = buffer + soFar;
      let array = soFar.split(matcher);
      soFar = array.shift();
      while(array.length) {
        if(stream.destroyed) {
          return;
        }
        stream.emit('data', array.pop());
      }
    }
  }
  
  stream.destroy = function () {
    if(stream.destroyed) {
      return;
    }

    stream.readable = false;
    stream.destroyed = true;
    stream.ended = true;

    function close () {
      fs.close(fd, function (err) {
        if(err) {
          onError(err);
        }
        stream.emit('close');
      });
    }

    if(!stream.started) {
      return stream.emit('close'); //allow for destroy on first tick.
    }
    if(!fd) {
      stream.once('open', close); //destroy before file opens.
    }
    else {
      close();  
    }
  }

  
  process.nextTick(function () {
    if(!stream.started) {
      stream.resume();
    }
  });

  return stream;
}