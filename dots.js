const canvas = document.getElementById('dots-bg');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const dots = [];

function spawnDot() {
  dots.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 0.5 + 0.5,
    a: 1,
    decay: Math.random() * 0.01 + 0.005
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dots.forEach(dot => {
    dot.a -= dot.decay;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${dot.a})`;
    ctx.fill();
  });

  for (let i = dots.length - 1; i >= 0; i--) {
    if (dots[i].a <= 0) dots.splice(i, 1);
  }

  if (Math.random() < 0.3) spawnDot();

  requestAnimationFrame(animate);
}

animate();