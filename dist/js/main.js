(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(url, callback) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status === 200) {
      callback(request);
    }
  };

  request.open('GET', url, true);

  request.send();
};

},{}],2:[function(require,module,exports){
module.exports = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

},{}],3:[function(require,module,exports){
module.exports = function(value, index, char) {
  return value.substr(0, index) + char + value.substr(index + 1);
};

},{}],4:[function(require,module,exports){
// Library.
var get = require('./lib/get');


// Classes.
var Music = require('./music');
var Scene = require('./scene');




// Menu.
var menu = require('./menu');


// Music.
var music = new Music(),
    musicPrev = document.querySelector('.music-prev'),
    musicToggle = document.querySelector('.music-toggle'),
    musicNext = document.querySelector('.music-next');

music.audio.addEventListener('ended', function() {
  music.load(music.songNext);
});

musicToggle.addEventListener('click', function(e) {
  e.stopPropagation();

  if (music.isPaused()) {
    this.classList.remove('is-paused');

    music.play();
  } else {
    this.classList.add('is-paused');

    music.pause();
  }
});

musicPrev.addEventListener('click', function(e) {
  e.stopPropagation();

  musicToggle.classList.remove('is-paused');

  music.prev();
});

musicNext.addEventListener('click', function(e) {
  e.stopPropagation();

  musicToggle.classList.remove('is-paused');

  music.next();
});


// Scene.
var scene = new Scene(music);

scene.createGeometry();
scene.createLight();
scene.createShaders();
scene.render();


// Icons.
get(
  'dist/img/sprites/sprites.svg',
  function (response) {
    var wrapper = document.createElement('div');

    wrapper.style.display = 'none';
    wrapper.innerHTML = response.responseText.replace(/\n/g, '');

    document.body.insertBefore(wrapper, document.body.childNodes[0]);
  }
);


// Window.
window.addEventListener('resize', function() {
  scene.resize();
}, false);

window.addEventListener('click', function(e) {
  scene.click(e);
}, false);

window.addEventListener('mousemove', function(e) {
  scene.mousemove(e);
}, false);

window.addEventListener('mousewheel', function(e) {
  var volume = Math.round(music.audio.volume * 100) / 100;

  if (e.wheelDelta < 0 && volume - 0.05 >= 0) {
    volume = Math.abs(volume - 0.05);
  } else if (e.wheelDelta > 0 && volume + 0.05 <= 1) {
    volume = Math.abs(volume + 0.05);
  }

  music.audio.volume = volume;
});

},{"./lib/get":1,"./menu":5,"./music":6,"./scene":11}],5:[function(require,module,exports){
var int = require('./lib/int');
var replace = require('./lib/replace');

module.exports = (function() {
  // Menu.
  var link = document.querySelectorAll('.menu-link'),
      linkOverInterval,
      linkOutInterval;


  for (var i = 0; i < link.length; i++) {
    var linkCurrent = link[i],
        linkCurrentParent = linkCurrent.parentNode;


    // Drag.
    Draggable.create(linkCurrentParent, {
      bounds: document.body,
      dragClickables: true,
      edgeResistance: 1,
      type: 'x, y',
      onDrag: function(e) {
        TweenLite.to(this.target, .1, {
          x: this.x,
          y: this.y
        });
      }
    });


    // Hover.
    linkCurrent.addEventListener('mouseover', function() {
      var link = this;

      linkOverInterval = setInterval(function() {
        var linkValue = link.innerHTML.trim();

        link.innerHTML = replace(
          linkValue,
          int(0, linkValue.length - 1),
          String.fromCharCode(int(65, 122))
        );
      }, 1);

      TweenLite.to(link, .4, {
        background: 'rgba(255, 255, 255, 1)',
        color: 'rgb(0, 0, 0)'
      });
    });

    linkCurrent.addEventListener('mouseout', function() {
      var link = this,
          linkText = link.getAttribute('data-text');

      clearInterval(linkOverInterval);

      var i = 0;

      var linkOutInterval = setInterval(function() {
        if (i < linkText.length) {
          var linKValue = link.innerHTML.trim();

          link.innerHTML = replace(
            linKValue,
            i,
            linkText[i]
          );
        } else {
          clearInterval(linkOutInterval);
        }

        i++;
      }, 1);

      TweenLite.to(link, .4, {
        background: 'rgba(255, 255, 255, 0)',
        color: 'rgb(255, 255, 255)'
      });
    });


    // Position.
    linkCurrentParent.style.left = int(0, window.innerWidth - linkCurrent.offsetWidth) + 'px';
    linkCurrentParent.style.top = int(0, window.innerHeight - linkCurrent.offsetHeight) + 'px';
  }
})();

},{"./lib/int":2,"./lib/replace":3}],6:[function(require,module,exports){
var get = require('./lib/get');

module.exports = Music;

function Music() {
  // Audio.
  this.audio = new Audio();
  this.audio.crossOrigin = 'anonymous';

  if (window.AudioContext || window.webkitAudioContext) {
    // Context.
    this.context = new (window.AudioContext || window.webkitAudioContext)();


    // Analyser.
    this.analyser = this.context.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.1;
    this.analyser.fftSize = 2048;
    this.analyser.connect(this.context.destination);

    // Source.
    this.src = this.context.createMediaElementSource(this.audio);
    this.src.connect(this.context.destination);
    this.src.connect(this.analyser);


    // Frequency.
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
  }

  // Songs.
  this.songs = [
    'https://soundcloud.com/leagueoflegends/dj-sona-kinetic-the-crystal',
    'https://soundcloud.com/alpineband/gasoline-2',
    'https://soundcloud.com/odesza/say_my_name',
//    'https://soundcloud.com/c2cdjs/down-the-road',
    'https://soundcloud.com/madeon/pay-no-mind',
    'https://soundcloud.com/futureclassic/hayden-james-something-about-you-2',
    'https://soundcloud.com/kflay/5-am-w-something-a-la-mode',
    'https://soundcloud.com/majorlazer/major-lazer-dj-snake-lean-on-feat-mo',
    'https://soundcloud.com/themagician/lykke-li-i-follow-rivers-the-magician-remix',
//    'https://soundcloud.com/prettylights/pretty-lights-finally-moving',
    'https://soundcloud.com/rac/lana-del-rey-blue-jeans-rac'
  ];


  // Playing.
  this.song = Math.floor(Math.random() * this.songs.length);
  this.songPrev = null;
  this.songNext = null;

  // Start.
  this.load(this.song);
};


// Methods.
Music.prototype.isPaused = function() {
  return this.audio.paused;
};


Music.prototype.isPlaying = function() {
  return !this.audio.paused;
};


Music.prototype.getFrequency = function() {
  this.analyser.getByteFrequencyData(this.frequency);

  return this.frequency;
};


Music.prototype.load = function(song) {
  var audio = this.audio;
  var songs = this.songs;

  get(
    '//api.soundcloud.com/resolve.json?url=' + songs[song] + '&client_id=78c6552c14b382e23be3bce2fc411a82',
    function(request) {
      var data = JSON.parse(request.responseText);
      var title = document.querySelector('.music-title');
      var user = document.querySelector('.music-user');

      audio.src = data.stream_url + '?client_id=78c6552c14b382e23be3bce2fc411a82';
      audio.play();

      title.setAttribute('href', data.permalink_url);
      title.textContent = data.title;

      user.setAttribute('href', data.user.permalink_url);
      user.textContent = data.user.username;
    }
  );

  this.song = song;
  this.songPrev = (this.song != 0) ? this.song - 1 : this.songs.length - 1;
  this.songNext = (this.song < this.songs.length - 1) ? this.song + 1 : 0;
};


Music.prototype.next = function() {
  this.load(this.songNext);
};


Music.prototype.prev = function() {
  this.load(this.songPrev);
};


Music.prototype.pause = function() {
  this.audio.pause();
};


Music.prototype.play = function() {
  this.audio.play();
};

},{"./lib/get":1}],7:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

module.exports = THREE.EffectComposer = function ( renderer, renderTarget ) {

	this.renderer = renderer;

	if ( renderTarget === undefined ) {

		var pixelRatio = renderer.getPixelRatio();

		var width  = Math.floor( renderer.context.canvas.width  / pixelRatio ) || 1;
		var height = Math.floor( renderer.context.canvas.height / pixelRatio ) || 1;
		var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat, stencilBuffer: false };

		renderTarget = new THREE.WebGLRenderTarget( width, height, parameters );

	}

	this.renderTarget1 = renderTarget;
	this.renderTarget2 = renderTarget.clone();

	this.writeBuffer = this.renderTarget1;
	this.readBuffer = this.renderTarget2;

	this.passes = [];

	if ( THREE.CopyShader === undefined )
	console.error( "THREE.EffectComposer relies on THREE.CopyShader" );

	this.copyPass = new THREE.ShaderPass( THREE.CopyShader );

};

THREE.EffectComposer.prototype = {

	swapBuffers: function() {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;

	},

	addPass: function ( pass ) {

		this.passes.push( pass );

	},

	insertPass: function ( pass, index ) {

		this.passes.splice( index, 0, pass );

	},

	render: function ( delta ) {

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		var maskActive = false;

		var pass, i, il = this.passes.length;

		for ( i = 0; i < il; i ++ ) {

			pass = this.passes[ i ];

			if ( ! pass.enabled ) continue;

			pass.render( this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive );

			if ( pass.needsSwap ) {

				if ( maskActive ) {

					var context = this.renderer.context;

					context.stencilFunc( context.NOTEQUAL, 1, 0xffffffff );

					this.copyPass.render( this.renderer, this.writeBuffer, this.readBuffer, delta );

					context.stencilFunc( context.EQUAL, 1, 0xffffffff );

				}

				this.swapBuffers();

			}

			if ( pass instanceof THREE.MaskPass ) {

				maskActive = true;

			} else if ( pass instanceof THREE.ClearMaskPass ) {

				maskActive = false;

			}

		}

	},

	reset: function ( renderTarget ) {

		if ( renderTarget === undefined ) {

			renderTarget = this.renderTarget1.clone();

			var pixelRatio = this.renderer.getPixelRatio();

			renderTarget.width  = Math.floor( this.renderer.context.canvas.width  / pixelRatio );
			renderTarget.height = Math.floor( this.renderer.context.canvas.height / pixelRatio );

		}

		this.renderTarget1.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2.dispose();
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

	},

	setSize: function ( width, height ) {

		this.renderTarget1.setSize( width, height );
		this.renderTarget2.setSize( width, height );

	}

};

},{}],8:[function(require,module,exports){
/**
* @author alteredq / http://alteredqualia.com/
*/

module.exports = THREE.MaskPass = function ( scene, camera ) {

  this.scene = scene;
  this.camera = camera;

  this.enabled = true;
  this.clear = true;
  this.needsSwap = false;

  this.inverse = false;

};

THREE.MaskPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta ) {

    var context = renderer.context;

    // don't update color or depth

    context.colorMask( false, false, false, false );
    context.depthMask( false );

    // set up stencil

    var writeValue, clearValue;

    if ( this.inverse ) {

      writeValue = 0;
      clearValue = 1;

    } else {

      writeValue = 1;
      clearValue = 0;

    }

    context.enable( context.STENCIL_TEST );
    context.stencilOp( context.REPLACE, context.REPLACE, context.REPLACE );
    context.stencilFunc( context.ALWAYS, writeValue, 0xffffffff );
    context.clearStencil( clearValue );

    // draw into the stencil buffer

    renderer.render( this.scene, this.camera, readBuffer, this.clear );
    renderer.render( this.scene, this.camera, writeBuffer, this.clear );

    // re-enable update of color and depth

    context.colorMask( true, true, true, true );
    context.depthMask( true );

    // only render where stencil is set to 1

    context.stencilFunc( context.EQUAL, 1, 0xffffffff );  // draw if == 1
    context.stencilOp( context.KEEP, context.KEEP, context.KEEP );

  }

};


THREE.ClearMaskPass = function () {

  this.enabled = true;

};

THREE.ClearMaskPass.prototype = {

  render: function ( renderer, writeBuffer, readBuffer, delta ) {

    var context = renderer.context;

    context.disable( context.STENCIL_TEST );

  }

};

},{}],9:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

module.exports = THREE.RenderPass = function ( scene, camera, overrideMaterial, clearColor, clearAlpha ) {

	this.scene = scene;
	this.camera = camera;

	this.overrideMaterial = overrideMaterial;

	this.clearColor = clearColor;
	this.clearAlpha = ( clearAlpha !== undefined ) ? clearAlpha : 1;

	this.oldClearColor = new THREE.Color();
	this.oldClearAlpha = 1;

	this.enabled = true;
	this.clear = true;
	this.needsSwap = false;

};

THREE.RenderPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		this.scene.overrideMaterial = this.overrideMaterial;

		if ( this.clearColor ) {

			this.oldClearColor.copy( renderer.getClearColor() );
			this.oldClearAlpha = renderer.getClearAlpha();

			renderer.setClearColor( this.clearColor, this.clearAlpha );

		}

		renderer.render( this.scene, this.camera, readBuffer, this.clear );

		if ( this.clearColor ) {

			renderer.setClearColor( this.oldClearColor, this.oldClearAlpha );

		}

		this.scene.overrideMaterial = null;

	}

};

},{}],10:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 */

module.exports = THREE.ShaderPass = function ( shader, textureID ) {

	this.textureID = ( textureID !== undefined ) ? textureID : "tDiffuse";

	this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

	this.material = new THREE.ShaderMaterial( {

		defines: shader.defines || {},
		uniforms: this.uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader

	} );

	this.renderToScreen = false;

	this.enabled = true;
	this.needsSwap = true;
	this.clear = false;


	this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene  = new THREE.Scene();

	this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.scene.add( this.quad );

};

THREE.ShaderPass.prototype = {

	render: function ( renderer, writeBuffer, readBuffer, delta ) {

		if ( this.uniforms[ this.textureID ] ) {

			this.uniforms[ this.textureID ].value = readBuffer;

		}

		this.quad.material = this.material;

		if ( this.renderToScreen ) {

			renderer.render( this.scene, this.camera );

		} else {

			renderer.render( this.scene, this.camera, writeBuffer, this.clear );

		}

	}

};

},{}],11:[function(require,module,exports){
var int = require('./lib/int');

var EffectComposer = require('./processing/effectcomposer');
var MaskPass = require('./processing/maskpass');
var RenderPass = require('./processing/renderpass');
var ShaderPass = require('./processing/shaderpass');
var CopyShader = require('./shaders/copyshader');
var RGBShiftShader = require('./shaders/rgbshift');

module.exports = Scene;

function Scene(music) {
  // Canvas.
  this.canvas = document.querySelector('.canvas');
  this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  this.camera.position.z = 275;
  this.camera.lookAt = new THREE.Vector3();


  // Scene.
  this.scene = new THREE.Scene();


  // Renderer.
  this.renderer = new THREE.WebGLRenderer({
    alpha: true,
    canvas: this.canvas
  });
  this.renderer.setSize(window.innerWidth, window.innerHeight);


  // Geometries.
  this.circle = [];
  this.geometry = [];
  this.geometrySleeve = [];
  this.geometryList = [
    new THREE.TetrahedronGeometry(50, 0),
    new THREE.IcosahedronGeometry(40, 0),
    new THREE.OctahedronGeometry(40, 0)
  ];


  // Composer.
  this.composer = new EffectComposer(this.renderer);


  // Mouse.
  this.mouse = {
    x: 0,
    y: 0
  };


  // Music.
  this.music = music;


  // Click.
  this.clicked = false;
}


// Values.
Scene.GEOMETRY_LENGTH = 100;


// Methods.
Scene.prototype.createGeometry = function() {
  var number = int(0, this.geometryList.length - 1);

  this.circle = new THREE.Object3D();

  for (var i = 0; i < Scene.GEOMETRY_LENGTH; i++) {
    this.geometry[i] = new THREE.Mesh(
      this.geometryList[number],
      new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        wireframe: true
      })
    );

    this.geometry[i].position.y = 100;

    // Surrogate Rings. [http://inmosystems.com/demos/surrogateRings/source/]
    this.geometrySleeve[i] = new THREE.Object3D();
    this.geometrySleeve[i].add(this.geometry[i]);
    this.geometrySleeve[i].rotation.z = i * (360 / Scene.GEOMETRY_LENGTH) * Math.PI / 180;

    this.circle.add(this.geometrySleeve[i]);
  }

  this.scene.add(this.circle);
};


Scene.prototype.createLight = function() {
  var light;

  light = new THREE.DirectionalLight(0xFFFFFF, 1);
  light.position.set(1, 1, 1);

  this.scene.add(light);

  light = new THREE.DirectionalLight(0xFFFFFF, 1);
  light.position.set(-1, -1, 1);

  this.scene.add(light);
};


Scene.prototype.createShaders = function() {
  var effect;

  this.composer.addPass(new RenderPass(this.scene, this.camera));

  effect = new ShaderPass(RGBShiftShader);
  effect.uniforms['amount'].value = 0.05;
  effect.renderToScreen = true;

  this.composer.addPass(effect);

  this.renderer.render(this.scene, this.camera);

  this.effect = effect;
};


Scene.prototype.render = function() {
  requestAnimationFrame(this.render.bind(this));

  // Shaders.
  if (this.clicked) {
    TweenLite.to(this.effect.uniforms['amount'], 1, {
      value: 0.005
    });
  } else {
    TweenLite.to(this.effect.uniforms['amount'], 1, {
      value: this.mouse.x / window.innerWidth
    });
  }


  // Movement.
  for (var i = 0; i < Scene.GEOMETRY_LENGTH; i++) {
    var value = 1;

    if (window.AudioContext || window.webkitAudioContext) {
      value = ((this.music.getFrequency()[i] / 256) * 2.5) + 0.01;
    }

    if (this.clicked) {
      TweenLite.to(this.geometry[i].scale, .1, {
        x: value,
        y: value,
        z: value
      });

      if (i % 2 == 0) {
        TweenLite.to(this.geometry[i].rotation, .1, {
          z: "+= 0.1"
        });
      } else {
        TweenLite.to(this.geometry[i].rotation, .1, {
          z: "-= 0.1"
        });
      }
    } else {
      TweenLite.to(this.geometry[i].scale, .1, {
        z: value
      });
    }
  }

  this.circle.rotation.z += 0.01;


  // Render.
  this.renderer.render(this.scene, this.camera);

  this.composer.render();
};


Scene.prototype.resize = function() {
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();

  this.renderer.setSize(window.innerWidth, window.innerHeight);
};


Scene.prototype.mousemove = function(e) {
  this.mouse.x = e.clientX - window.innerWidth / 2;
  this.mouse.y = e.clientY - window.innerHeight / 2;
};


Scene.prototype.click = function() {
  if (this.clicked) {
    for (var i = 0; i < Scene.GEOMETRY_LENGTH; i++) {
      TweenLite.to(this.geometry[i].scale, 1, {
        x: 1,
        y: 1,
        z: 1
      });

      TweenLite.to(this.geometry[i].rotation, 1, {
        x: 0,
        y: 0,
        z: 0
      });

      TweenLite.to(this.geometry[i].position, 1, {
        x: 0,
        y: 100,
        z: 0
      });
    }

    this.clicked = false;
  } else {
    for (var i = 0; i < Scene.GEOMETRY_LENGTH; i++) {
      TweenLite.to(this.geometry[i].rotation, 1, {
        x: int(0, Math.PI),
        y: int(0, Math.PI),
        z: int(0, Math.PI)
      });

      TweenLite.to(this.geometry[i].position, 1, {
        x: "+= " + int(-1000, 1000),
        y: "+= " + int(-1000, 1000),
        z: "+= " + int(-500, -250)
      });
    }

    this.clicked = true;
  }
};

},{"./lib/int":2,"./processing/effectcomposer":7,"./processing/maskpass":8,"./processing/renderpass":9,"./processing/shaderpass":10,"./shaders/copyshader":12,"./shaders/rgbshift":13}],12:[function(require,module,exports){
/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */

module.exports = THREE.CopyShader = {
  uniforms: {
    "tDiffuse": { type: "t", value: null },
    "opacity":  { type: "f", value: 1.0 }
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join( "\n" ),
  fragmentShader: [
    "uniform float opacity;",
    "uniform sampler2D tDiffuse;",
    "varying vec2 vUv;",
    "void main() {",
    "vec4 texel = texture2D( tDiffuse, vUv );",
    "gl_FragColor = opacity * texel;",
    "}"
  ].join( "\n" )
};

},{}],13:[function(require,module,exports){
/**
* @author felixturner / http://airtight.cc/
*
* RGB Shift Shader
* Shifts red and blue channels from center in opposite directions
* Ported from http://kriss.cx/tom/2009/05/rgb-shift/
* by Tom Butterworth / http://kriss.cx/tom/
*
* amount: shift distance (1 is width of input)
* angle: shift angle in radians
*/

module.exports = THREE.RGBShiftShader = {
  uniforms: {
    "tDiffuse": { type: "t", value: null },
    "amount":   { type: "f", value: 0.005 },
    "angle":    { type: "f", value: 0.0 }
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join("\n"),
  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "uniform float amount;",
    "uniform float angle;",
    "varying vec2 vUv;",
    "void main() {",
    "vec2 offset = amount * vec2( cos(angle), sin(angle));",
    "vec4 cr = texture2D(tDiffuse, vUv + offset);",
    "vec4 cga = texture2D(tDiffuse, vUv);",
    "vec4 cb = texture2D(tDiffuse, vUv - offset);",
    "gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);",
    "}"
  ].join("\n")
};

},{}]},{},[4]);
