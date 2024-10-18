const canvas = document.getElementById("gameCanvas");
        const ctx = canvas.getContext("2d");

        let player = { x: 400, y: 500, width: 50, height: 50, health: 100 };
        let enemies = [];
        let bullets = [];
        let bombs = [];
        let score = 0;
        let shootingMode = 'auto';
        const shootSound = new Audio('shoot.mp3');
        const laserSound = new Audio('laser.mp3');
        const explosionSound = new Audio('explosion.mp3');
        const deathSound = new Audio('death.mp3'); // Yeni ses dosyası
        let laserInterval = null;
        let autoFireInterval = null;
        let bombInterval = null;

        // Yeni düşman oluşturma işlevi
function createEnemy() {
    let enemyType = Math.random();
    let enemy;

    // Mevcut düşmanlar
    if (enemyType < 0.5) {
        enemy = { x: Math.random() * (canvas.width - 50), y: 0, width: 50, height: 50, health: 50, color: 'red' };
    } else if (enemyType < 0.8) {
        enemy = { x: Math.random() * (canvas.width - 30), y: 0, width: 30, height: 30, health: 100, color: 'purple' };
    } else if (enemyType < 0.9) {
        enemy = { x: Math.random() * (canvas.width - 60), y: 0, width: 60, height: 30, health: 200, color: 'lime' };
    } else {
        // Yeni düşman
        let sigmaImage = new Image();
        sigmaImage.src = 'sigma.png';
        enemy = {
            x: Math.random() * (canvas.width - 40),
            y: 0,
            width: 40,
            height: 40,
            health: 150,
            color: 'blue',
            image: sigmaImage,
            type: 'sigma'
        };
    }
    enemies.push(enemy);
}

    function updateScore(points) {
    score += points; // Puanı artır
    document.getElementById("score").innerText = `Puan: ${score}`; // HTML'de güncelle
}
        function shoot() {
            let bullet = { x: player.x + 20, y: player.y, speed: 5, type: 'normal' };
            bullets.push(bullet);
            shootSound.currentTime = 0;
            shootSound.play();
        }

        function shootLaser() {
            let bullet = { x: player.x + 20, y: player.y, speed: 10, type: 'laser' };
            bullets.push(bullet);
            laserSound.currentTime = 0;
            laserSound.play();
        }

        function throwBomb() {
            let bomb = { x: player.x + 20, y: player.y, speed: 3, isExploded: false };
            bombs.push(bomb);
        }

        function detectCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + 5 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 10 > enemy.y) {
                
                enemy.health -= (bullet.type === 'laser') ? 50 : 25;
                bullets.splice(bulletIndex, 1);
                
                if (enemy.health <= 0) {
                    if (enemy.type === 'sigma') { // Sadece yeni düşman için kontrol
                        deathSound.currentTime = 0; // Ölüm sesini sıfırla
                        deathSound.play(); // Ölüm sesini çal
                    }
                    enemies.splice(enemyIndex, 1);
                    updateScore(100); // Düşman öldüğünde puanı artır
                }
            }
        });
    });
}

        function detectBombCollisions() {
            bombs.forEach((bomb, bombIndex) => {
                if (bomb.isExploded) return; // Eğer bomba zaten patlamışsa, kontrol etme

                enemies.forEach((enemy, enemyIndex) => {
                    if (bomb.x < enemy.x + enemy.width &&
                        bomb.x + 10 > enemy.x &&
                        bomb.y < enemy.y + enemy.height &&
                        bomb.y + 10 > enemy.y) {
                        
                        bomb.isExploded = true; 
                        explosionSound.currentTime = 0; 
                        explosionSound.play(); 
                        createExplosionEffect(bomb.x, bomb.y); 
                        bombs.splice(bombIndex, 1); 

                        // Patlama etkisi için AOE hasarını uygula
                        enemies.forEach((affectedEnemy, affectedIndex) => {
                            const distance = Math.hypot(affectedEnemy.x - bomb.x, affectedEnemy.y - bomb.y);
                            if (distance < 450) { // Patlama alanı
                                affectedEnemy.health -= 150; // AOE hasarı
                                if (affectedEnemy.health <= 0) {
                                    enemies.splice(affectedIndex, 1);
                                    deathSound.currentTime = 0; // Ses dosyasını baştan çal
                                    deathSound.play(); // Düşman öldüğünde ses çal
                                }
                            }
                        });
                    }
                });
            });
        }

        function createExplosionEffect(x, y) {
            ctx.fillStyle = 'orange'; 
            ctx.fillRect(x - 20, y - 20, 60, 60); 
            setTimeout(() => {
                ctx.clearRect(x - 20, y - 20, 60, 60); 
            }, 400);
        }

        function checkPlayerCollision() {
            enemies.forEach(enemy => {
                if (player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y) {
                    player.health -= 10;
                    enemies.splice(enemies.indexOf(enemy), 1);
                }
            });
        }

        function update() {
            bullets.forEach(b => {
                b.y -= b.speed; // Dikey hareket
        
                // Eğer mermi TRIPLE türünde ise yatay hareket yap
                if (b.type === bulletTypes.TRIPLE) {
                    b.x += b.direction * 2; // Yatay hareket (her mermi kendi yönünde hareket eder)
                }
                // Diğer mermi türleri için farklı davranışlar ekleyin
                else if (b.type === bulletTypes.AUTO) {
                    // Otomatik ateş için farklı bir hareket tarzı ekleyin (gerekiyorsa)
                }
            });
        
            bombs.forEach(b => {
                if (!b.isExploded) {
                    b.y -= b.speed; 
                }
            });
            enemies.forEach(e => e.y += 1);
            detectCollisions();
            detectBombCollisions(); 
            checkPlayerCollision();
        
            if (Math.random() < 0.02) createEnemy();
            
            if (player.health <= 0) {
                showDefeatScreen(); // Sağlık sıfırsa yenilgi ekranını göster
            }
        
            bullets = bullets.filter(b => b.y > 0 && b.x > 0 && b.x < canvas.width); // Mermileri ekranın dışına çıktığında yok et
            bombs = bombs.filter(b => !b.isExploded && b.y > 0); 
        }        

function showDefeatScreen() {
    // Yenilgi ekranını görünür yap
    const defeatScreen = document.createElement("div");
    defeatScreen.id = "defeatScreen";
    defeatScreen.style.position = "absolute";
    defeatScreen.style.top = "50%";
    defeatScreen.style.left = "50%";
    defeatScreen.style.transform = "translate(-50%, -50%)";
    defeatScreen.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
    defeatScreen.style.color = "#333";
    defeatScreen.style.padding = "30px";
    defeatScreen.style.borderRadius = "15px";
    defeatScreen.style.textAlign = "center";
    defeatScreen.style.zIndex = "1000";
    defeatScreen.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.2)";

    defeatScreen.innerHTML = `
        <h2 style="color: #333;">YENİLGİ</h2>
        <p style="color: #555;">Oyunu kaybettin.</p>
        <button id="restartButton" style="
            background-color: #888;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s;
        ">Tekrar Oyna</button>
    `;

    document.body.appendChild(defeatScreen);

    // "Tekrar Oyna" butonuna tıklama olayını ekle
    document.getElementById("restartButton").addEventListener("click", () => {
        defeatScreen.remove(); // Ekranı tamamen kaldır
        restartGame(); // Oyunu yeniden başlat
    });
}

function restartGame() {
    // Oyuncunun konumunu ve sağlık durumunu sıfırla
    player = { x: 400, y: 500, width: 50, height: 50, health: 100 };
    
    // Düşmanlar, mermiler ve bombaları sıfırla
    enemies = [];
    bullets = [];
    bombs = [];
    
    // Puanı sıfırla
    score = 0;
    document.getElementById("score").innerText = "Puan: 0";
    
    // Yenilgi ekranını kaldır
    const defeatScreen = document.getElementById("defeatScreen");
    if (defeatScreen) {
        defeatScreen.remove();
    }
    
    // Oyun döngüsünü tekrar başlat
    gameLoop();
}

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "blue"; 
            ctx.fillRect(player.x, player.y, player.width, player.height);

            bullets.forEach(b => {
                ctx.fillStyle = b.type === 'laser' ? 'cyan' : 'orange';
                ctx.fillRect(b.x, b.y, 5, 10);
            });
            bombs.forEach(b => {
                if (!b.isExploded) {
                    ctx.fillStyle = 'gray'; 
                    ctx.fillRect(b.x, b.y, 10, 10);
                }
            });
            enemies.forEach(e => {
                ctx.fillStyle = e.color;
                if (e.image) {
                    ctx.drawImage(e.image, e.x, e.y, e.width, e.height); // Yeni düşmanın resmi
                } else {
                    ctx.fillRect(e.x, e.y, e.width, e.height);
                }
            });

            ctx.fillStyle = "lime"; 
            ctx.font = "20px Arial";
            ctx.fillText(`Sağlık: ${player.health}`, 10, 20);
        }

        let keyState = {};

        document.addEventListener("keydown", function(event) {
            event.preventDefault();
            keyState[event.code] = true;
        
            if (event.code === "Digit1") {
                shootingMode = 'auto';
            } else if (event.code === "Digit2") {
                shootingMode = 'laser';
            } else if (event.code === "Digit3") {
                shootingMode = 'bomb';
            } else if (event.code === "Digit4") {
                shootingMode = 'shotgun';
            }
        });

document.addEventListener("keyup", function(event) {
    keyState[event.code] = false; // Tuşun bırakıldığını izleme
});

function updatePlayerMovement() {
    if (keyState["KeyW"] && player.y > 0) player.y -= 3; 
    if (keyState["KeyA"] && player.x > 0) player.x -= 3; 
    if (keyState["KeyS"] && player.y < canvas.height - player.height) player.y += 3; 
    if (keyState["KeyD"] && player.x < canvas.width - player.width) player.x += 3;
}

function gameLoop() {
    updatePlayerMovement(); // Hareket güncellemesi
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

        function startAutoFire() {
            if (autoFireInterval) return;
            autoFireInterval = setInterval(() => {
                if (shootingMode === 'auto') shoot();
            }, 100);
        }

        function stopAutoFire() {
            clearInterval(autoFireInterval);
            autoFireInterval = null;
        }

        function startLaserFire() {
            if (laserInterval) return;
            laserInterval = setInterval(() => {
                if (shootingMode === 'laser') shootLaser();
            }, 300);
        }

        function stopLaserFire() {
            clearInterval(laserInterval);
            laserInterval = null;
        }

        function startBombFire() {
            if (bombInterval) return;
            bombInterval = setInterval(() => {
                if (shootingMode === 'bomb') throwBomb();
            }, 750);
        }

        function stopBombFire() {
            clearInterval(bombInterval);
            bombInterval = null;
        }

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Sol tıklama
                if (shootingMode === 'auto') startAutoFire();
                if (shootingMode === 'laser') startLaserFire();
                if (shootingMode === 'bomb') startBombFire();
            }
        });

        window.addEventListener('mouseup', () => {
            stopAutoFire();
            stopLaserFire();
            stopBombFire();
        });

        gameLoop();