document.addEventListener('DOMContentLoaded', () => {
    // 🔄 Modificação 1: Adicione 3 chaves
    const apiKeys = [
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE", // Chave 1
        "SUA_SEGUNDA_CHAVE",                      // Chave 2
        "SUA_TERCEIRA_CHAVE"                      // Chave 3
    ];
    
    const CHANNEL_ID = "SEU_CHANNEL_ID";
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    
    // 🔄 Modificação 2: Variável de controle de chaves
    let keyIndex = 0;
    let isLiveActive = false;

    // ✅ Sua função original intacta
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 🔄 Modificação 3: Sistema de rotação de chaves
    const rotateKey = () => {
        keyIndex = (keyIndex + 1) % apiKeys.length;
        console.log(`Usando chave: ${keyIndex + 1}`);
    };

    // 🔄 Modificação 4: Controle de status da live
    const getLiveVideoId = async () => {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            if(response.status === 403) {
                rotateKey();
                return null;
            }

            const data = await response.json();
            return data.items[0]?.id?.videoId || null;

        } catch(error) {
            console.error("Erro:", error);
            return null;
        }
    };

    // ✅ Sua função original com melhorias
    const updateLikes = async () => {
        try {
            const VIDEO_ID = await getLiveVideoId();
            
            if(!VIDEO_ID) {
                if(isLiveActive) {
                    // 🔄 Reset automático quando live termina
                    meta = 100;
                    document.getElementById("progressBar").style.width = "0%";
                    document.getElementById("likeText").textContent = "00000 / 100";
                }
                isLiveActive = false;
                return;
            }

            // ⚡ Ativação automática quando live inicia
            if(!isLiveActive) {
                isLiveActive = true;
                meta = 100; // Reset da meta
                console.log("Live detectada - Sistema ativado!");
            }

            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[keyIndex]}`);
            
            if(statsResponse.status === 403) {
                rotateKey();
                return;
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;

            // ✅ Sua UI original intacta
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            if(likes >= meta) {
                meta += 100;
                gemText.innerHTML = `META: <img src="gemas-png.png" class="gem-glow gem-icon" 
                    style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;"> ${meta}`;
            }

        } catch(error) {
            console.error("Erro geral:", error);
        }
    };

    // 🔄 Modificação 5: Intervalos otimizados
    let updateInterval = setInterval(() => {
        updateLikes();
    }, isLiveActive ? 10000 : 30000); // 10s se live, 30s se offline

    // Monitora status da live para ajustar intervalos
    const checkLiveStatus = () => {
        getLiveVideoId().then(videoId => {
            if(videoId && !isLiveActive) {
                clearInterval(updateInterval);
                updateInterval = setInterval(updateLikes, 10000);
            }
        });
    };

    // ✅ Seus intervalos originais mantidos
    setInterval(checkLiveStatus, 30000); // Verifica live a cada 30s
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});