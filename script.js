document.addEventListener('DOMContentLoaded', () => {
    const apiKeys = [
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE",
        "AIzaSyD0RYlWMxtWdqBU7-rnvIh2c-XLVGsgvxQ",
        "AIzaSyAUs6SFHwoQXbUcwaB7ll2vJNl0tiATWL4" 
    ];
    
    let currentKeyIndex = 0;
    const channelId = "UCfxuVyjFhkf4gj_HyCnxLRg";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let isLive = false;

    // 👇 Adicionei contador de tentativas
    let attemptCount = 0;
    const MAX_ATTEMPTS = 3;

    const cycleApiKey = () => {
        if(currentKeyIndex < apiKeys.length - 1 && attemptCount < MAX_ATTEMPTS) {
            currentKeyIndex++;
            attemptCount++;
            console.log(`Tentativa ${attemptCount}: Alternando para chave V${currentKeyIndex + 1}`);
        }
    };

    const updateLikes = async () => {
        try {
            // 👇 Adicionei timestamp para debug
            console.log(`[${new Date().toLocaleTimeString()}] Iniciando verificação...`);
            
            const liveResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKeys[currentKeyIndex]}`);
            
            // 👇 Verificação detalhada da resposta
            if(!liveResponse.ok) {
                console.warn("Erro na resposta LIVE:", liveResponse.status, liveResponse.statusText);
                cycleApiKey();
                return;
            }

            const liveData = await liveResponse.json();
            console.log("Dados da live:", liveData); // 👈 Log crítico
            
            if (liveData.items?.length > 0) {
                const videoId = liveData.items[0].id.videoId;
                console.log("VideoID detectado:", videoId);
                
                const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKeys[currentKeyIndex]}`);
                
                if(!statsResponse.ok) {
                    console.warn("Erro na resposta STATS:", statsResponse.status, statsResponse.statusText);
                    cycleApiKey();
                    return;
                }

                const statsData = await statsResponse.json();
                console.log("Dados de likes:", statsData); // 👈 Log crítico
                
                // 👇 Verificação reforçada dos likes
                const rawLikes = statsData.items[0]?.statistics?.likeCount || "0";
                const likes = parseInt(rawLikes) || 0;
                console.log(`Likes (raw: ${rawLikes} | parsed: ${likes})`);

                // 👇 Atualização forçada com requestAnimationFrame
                requestAnimationFrame(() => {
                    document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
                    document.getElementById("likeText").textContent = 
                        `${likes.toString().padStart(5, '0')} / ${meta}`;
                });

                // 👇 Condição de meta melhorada
                if (likes >= meta) {
                    const newMeta = meta + 100;
                    console.log(`Meta atingida! ${meta} -> ${newMeta}`);
                    meta = newMeta;
                    gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                        style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
                }
            }
        } catch(error) {
            console.error("Erro crítico:", error);
            cycleApiKey();
        }
    };

    // Reduza o intervalo temporariamente para testes (1 minuto)
    setInterval(updateLikes, 60000); // 👈 Alterado para 60 segundos
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});