(function () {
  var container = document.querySelector('#magic');
  if (!container || !document.body.dataset.pixelText) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  var config = {
    text: document.body.dataset.pixelText || 'PORTFOLIO',
    amount: parseInt(document.body.dataset.pixelAmount, 10) || 1200,
    particleSize: parseFloat(document.body.dataset.pixelSize) || 1,
    textSize: parseFloat(document.body.dataset.pixelTextSize) || 4.2,
    area: parseInt(document.body.dataset.pixelArea, 10) || 220,
    ease: 0.05,
  };

  var typo = null;
  var particle = null;
  var environment = null;

  function preload() {
    var manager = new THREE.LoadingManager();
    manager.onLoad = function () {
      environment = new PixelEnvironment(typo, particle, config);
    };

    new THREE.FontLoader(manager).load(
      'https://res.cloudinary.com/dydre7amr/raw/upload/v1612950355/font_zsd4dr.json',
      function (font) {
        typo = font;
      }
    );

    particle = new THREE.TextureLoader(manager).load(
      'https://res.cloudinary.com/dfvtkoboz/image/upload/v1605013866/particle_a64uzf.png'
    );
  }

  class PixelEnvironment {
    constructor(font, particleImg, data) {
      this.font = font;
      this.particle = particleImg;
      this.data = data;
      this.container = container;
      this.scene = new THREE.Scene();
      this.createCamera();
      this.createRenderer();
      this.createParticles = new PixelParticles(
        this.scene,
        this.font,
        this.particle,
        this.camera,
        this.renderer,
        this.data
      );
      window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    render() {
      this.createParticles.render();
      this.renderer.render(this.scene, this.camera);
    }

    createCamera() {
      this.camera = new THREE.PerspectiveCamera(
        65,
        this.container.clientWidth / this.container.clientHeight,
        1,
        10000
      );
      this.camera.position.set(0, 0, 100);
    }

    createRenderer() {
      this.renderer = new THREE.WebGLRenderer({ alpha: true });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.container.appendChild(this.renderer.domElement);
      this.renderer.setAnimationLoop(this.render.bind(this));
    }

    onWindowResize() {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
  }

  class PixelParticles {
    constructor(scene, font, particleImg, camera, renderer, data) {
      this.scene = scene;
      this.font = font;
      this.particleImg = particleImg;
      this.camera = camera;
      this.renderer = renderer;
      this.data = data;
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2(-200, 200);
      this.colorChange = new THREE.Color();
      this.buttom = false;
      this.setup();
      this.bindEvents();
    }

    setup() {
      var geometry = new THREE.PlaneGeometry(
        this.visibleWidthAtZDepth(100, this.camera),
        this.visibleHeightAtZDepth(100, this.camera)
      );
      this.planeArea = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true })
      );
      this.planeArea.visible = false;
      this.scene.add(this.planeArea);
      this.createText();
    }

    bindEvents() {
      document.addEventListener('mousedown', this.onMouseDown.bind(this));
      document.addEventListener('mousemove', this.onMouseMove.bind(this));
      document.addEventListener('mouseup', this.onMouseUp.bind(this));

      var playground = document.querySelector('.playground');
      if (playground) {
        playground.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
        playground.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        playground.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
      }
    }

    onMouseDown(event) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.buttom = true;
      this.data.ease = 0.01;
    }

    onMouseUp() {
      this.buttom = false;
      this.data.ease = 0.05;
    }

    onMouseMove(event) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onTouchStart(event) {
      event.preventDefault();
      var touch = event.touches[0];
      this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
      this.buttom = true;
      this.data.ease = 0.01;
    }

    onTouchMove(event) {
      event.preventDefault();
      var touch = event.touches[0];
      this.mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    }

    onTouchEnd(event) {
      event.preventDefault();
      this.buttom = false;
      this.data.ease = 0.05;
    }

    render() {
      var time = ((0.001 * performance.now()) % 12) / 12;
      var zigzagTime = (1 + Math.sin(time * 2 * Math.PI)) / 6;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      var intersects = this.raycaster.intersectObject(this.planeArea);

      if (intersects.length > 0) {
        var pos = this.particles.geometry.attributes.position;
        var copy = this.geometryCopy.attributes.position;
        var coulors = this.particles.geometry.attributes.customColor;
        var size = this.particles.geometry.attributes.size;
        var mx = intersects[0].point.x;
        var my = intersects[0].point.y;
        var mz = intersects[0].point.z;

        for (var i = 0, l = pos.count; i < l; i++) {
          var initX = copy.getX(i);
          var initY = copy.getY(i);
          var initZ = copy.getZ(i);
          var px = pos.getX(i);
          var py = pos.getY(i);
          var pz = pos.getZ(i);

          this.colorChange.setHSL(0.5, 1, 1);
          coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
          coulors.needsUpdate = true;
          size.array[i] = this.data.particleSize;
          size.needsUpdate = true;

          var dx = mx - px;
          var dy = my - py;
          var d = dx * dx + dy * dy;
          var f = -this.data.area / d;
          var mouseDistance = this.distance(mx, my, px, py);

          if (this.buttom) {
            var t = Math.atan2(dy, dx);
            px -= f * Math.cos(t);
            py -= f * Math.sin(t);
            this.colorChange.setHSL(0.5 + zigzagTime, 1.0, 0.5);
            coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
            coulors.needsUpdate = true;
          } else if (mouseDistance < this.data.area) {
            if (i % 5 === 0) {
              t = Math.atan2(dy, dx);
              px -= 0.03 * Math.cos(t);
              py -= 0.03 * Math.sin(t);
              this.colorChange.setHSL(0.15, 1.0, 0.5);
              coulors.setXYZ(i, this.colorChange.r, this.colorChange.g, this.colorChange.b);
              coulors.needsUpdate = true;
              size.array[i] = this.data.particleSize / 1.2;
              size.needsUpdate = true;
            } else {
              t = Math.atan2(dy, dx);
              px += f * Math.cos(t);
              py += f * Math.sin(t);
              size.array[i] = this.data.particleSize * 1.3;
              size.needsUpdate = true;
            }
          }

          px += (initX - px) * this.data.ease;
          py += (initY - py) * this.data.ease;
          pz += (initZ - pz) * this.data.ease;
          pos.setXYZ(i, px, py, pz);
          pos.needsUpdate = true;
        }
      }
    }

    createText() {
      var thePoints = [];
      var shapes = this.font.generateShapes(this.data.text, this.data.textSize);
      var geometry = new THREE.ShapeGeometry(shapes);
      geometry.computeBoundingBox();

      var xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
      var yMid = (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2.85;
      geometry.center();

      var holeShapes = [];
      for (var q = 0; q < shapes.length; q++) {
        if (shapes[q].holes && shapes[q].holes.length > 0) {
          for (var j = 0; j < shapes[q].holes.length; j++) {
            holeShapes.push(shapes[q].holes[j]);
          }
        }
      }
      shapes.push.apply(shapes, holeShapes);

      var colors = [];
      var sizes = [];
      for (var x = 0; x < shapes.length; x++) {
        var shape = shapes[x];
        var amountPoints = shape.type === 'Path' ? this.data.amount / 2 : this.data.amount;
        var points = shape.getSpacedPoints(amountPoints);
        points.forEach(function (element) {
          thePoints.push(new THREE.Vector3(element.x, element.y, 0));
          colors.push(1, 1, 1);
          sizes.push(1);
        });
      }

      var geoParticles = new THREE.BufferGeometry().setFromPoints(thePoints);
      geoParticles.translate(xMid, yMid, 0);
      geoParticles.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
      geoParticles.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

      var vShader = document.getElementById('vertexshader');
      var fShader = document.getElementById('fragmentshader');
      if (!vShader || !fShader) return;

      var material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          pointTexture: { value: this.particleImg },
        },
        vertexShader: vShader.textContent,
        fragmentShader: fShader.textContent,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
      });

      this.particles = new THREE.Points(geoParticles, material);
      this.scene.add(this.particles);
      this.geometryCopy = new THREE.BufferGeometry();
      this.geometryCopy.copy(this.particles.geometry);
    }

    visibleHeightAtZDepth(depth, camera) {
      var cameraOffset = camera.position.z;
      if (depth < cameraOffset) depth -= cameraOffset;
      else depth += cameraOffset;
      var vFOV = (camera.fov * Math.PI) / 180;
      return 2 * Math.tan(vFOV / 2) * Math.abs(depth);
    }

    visibleWidthAtZDepth(depth, camera) {
      return this.visibleHeightAtZDepth(depth, camera) * camera.aspect;
    }

    distance(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
  }

  if (document.readyState === 'complete' || document.readyState !== 'loading') {
    preload();
  } else {
    document.addEventListener('DOMContentLoaded', preload);
  }
})();
