/**
 * This fs stream api is to read a file in backwards. It is similar to fs-reverse except 
 * only using plain node fs without additional dependecies. This implementation uses fs-reverse
 * for the reference.
 * 
 * Copyright (c) 2022 Min Hu 
 * Copyright (c) 2011 Dominic Tarr 
 * Permission is hereby granted, free of charge, 
 * to any person obtaining a copy of this software and 
 * associated documentation files (the "Software"), to 
 * deal in the Software without restriction, including 
 * without limitation the rights to use, copy, modify, 
 * merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom 
 * the Software is furnished to do so, 
 * subject to the following conditions:
**/
let fs = require('fs');
let Stream = require('stream');

module.exports = function (file, opts) {
  if (!fs.existsSync(file)) {
    throw new Error("The file doesn't exist: " + file);
  }

  let matcher = opts && opts.matcher || '\n';
  let bufferSize = opts && opts.bufferSize || 1024 * 64;

  let stream = new Stream();
  stream.ended = false;
  stream.started = false;
  stream.readable = true;
  stream.reading = false;

  let remaining = '';
  let fd, position;

  stream.on('end', function () {
    stream.ended = true;
    stream.readable = false;
    process.nextTick(stream.destroy);
  }).on('close', function () {
    if (fd && !stream.reading) {
      fs.close(fd, () => { });
    }
  }).on('error', function () {
    stream.reading = false;
  });

  function onError(err) {
    stream.emit('error', err);
    stream.destroy();
  }

  stream.destroy = function () {
    stream.readable = false;
    stream.destroyed = true;
    stream.ended = true;

    stream.emit('close');
  }

  // open the file 
  function openFile() {
    fs.open(file, 'r', 438, function (err, _fd) {
      if (err) {
        onError(err);
        return;
      }
      stream.started = true;
      fd = _fd;
      getFileSize();
    });
  }

  // state file to get total size
  function getFileSize() {
    fs.stat(file, function (err, stat) {
      if (err) {
        onError(err);
        return;
      }
      position = stat.size;
      loopReadFile();
    })
  }

  function loopReadFile() {
    if (stream.destroyed || stream.ended) {
      return;
    }

    let length = Math.min(bufferSize, position);
    let buf = Buffer.alloc(length);
    position = position - length;
    stream.reading = true;
    fs.read(fd, buf, 0, length, position, function (err) {
      stream.reading = false;

      if (err) {
        onError(err);
        return;
      }

      parseBufferData(buf);
      if (position > 0) {
        if (!stream.ended && !stream.paused) {
          process.nextTick(loopReadFile);
        }
        return;
      }
      if (remaining) {
        stream.emit('data', remaining);
      }
      stream.emit('end');
      stream.destroy();
    });
  }

  function parseBufferData(buffer) {
    let adjustedData = buffer + remaining;
    let array = adjustedData.split(matcher);
    remaining = array.shift();
    while (array.length) {
      if (stream.destroyed) {
        return;
      }
      stream.emit('data', array.pop());
    }
  }

  process.nextTick(openFile);

  return stream;
}