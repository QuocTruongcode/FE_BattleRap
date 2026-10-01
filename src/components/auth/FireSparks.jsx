import { useEffect, useRef } from 'react';

export default function FireSparks() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let animationFrame;
        let lastTime = 0;
        let emissionTime = 0;
        let particles = [];

        const resizeCanvas = () => {
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = window.innerWidth * pixelRatio;
            canvas.height = window.innerHeight * pixelRatio;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        };

        const createParticle = () => ({
            x: Math.random() * window.innerWidth,
            y: window.innerHeight * (0.78 + Math.random() * 0.2),
            size: 0.7 + Math.random() * 2.6,
            life: 0.6 + Math.random() * 1.5,
            age: 0,
            velocityX: (Math.random() - 0.5) * 28,
            velocityY: -(35 + Math.random() * 105),
            color: ['#ff3b1f', '#ff6a1a', '#ffb347', '#ffd166'][Math.floor(Math.random() * 4)],
        });

        const drawParticle = (particle) => {
            const lifeProgress = particle.age / particle.life;
            const opacity = Math.sin(Math.PI * lifeProgress) * 0.9;
            const radius = particle.size * (1 - lifeProgress * 0.35);

            context.beginPath();
            context.fillStyle = particle.color;
            context.globalAlpha = opacity;
            context.shadowBlur = 10;
            context.shadowColor = particle.color;
            context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
            context.fill();
        };

        const animate = (time) => {
            const delta = Math.min((time - lastTime) / 1000 || 0, 0.04);
            lastTime = time;
            emissionTime += delta;

            context.clearRect(0, 0, window.innerWidth, window.innerHeight);
            context.globalAlpha = 1;
            context.shadowBlur = 0;

            if (emissionTime > 0.035) {
                const particlesToAdd = Math.floor(emissionTime / 0.035);
                emissionTime %= 0.035;
                for (let index = 0; index < particlesToAdd; index += 1) {
                    particles.push(createParticle());
                }
            }

            particles = particles.filter((particle) => {
                particle.age += delta;
                particle.x += particle.velocityX * delta;
                particle.y += particle.velocityY * delta;
                particle.velocityY += 18 * delta;

                if (particle.age < particle.life) {
                    drawParticle(particle);
                    return true;
                }
                return false;
            });

            animationFrame = window.requestAnimationFrame(animate);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        if (reducedMotion) {
            for (let index = 0; index < 28; index += 1) {
                particles.push(createParticle());
                particles[index].age = Math.random() * particles[index].life;
            }
            context.clearRect(0, 0, window.innerWidth, window.innerHeight);
            particles.forEach(drawParticle);
        } else {
            animationFrame = window.requestAnimationFrame(animate);
        }

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return <canvas className="login-background__sparks" ref={canvasRef} aria-hidden="true" />;
}