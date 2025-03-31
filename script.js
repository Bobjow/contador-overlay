document.addEventListener('DOMContentLoaded', () => {
    // 🔄 Array com 3 chaves (mantenha sua estrutura)
    const apiKeys = [
        "AIzaSyA8gSkzWGn9YhXoLjRPcdwuh2ESyt3eUJE", // Key 1
        "SUA_KEY_2", // Key 2
        "SUA_KEY_3"  // Key 3
    ];
    
    const CHANNEL_ID = "SEU_CHANNEL_ID"; 
    let meta = 100;
    let currentMessage = 0;
    const messages = document.querySelectorAll('.msg');
    const gemText = document.querySelector('#messageBox .msg:last-child');
    let keyIndex = 0; // 👈 Controle de chaves

    // ✅ Rotação de mensagens INTACTA
    const rotateMessages = () => {
        messages.forEach(msg => msg.classList.remove('active'));
        messages[currentMessage].classList.add('active');
        currentMessage = (currentMessage + 1) % 3;
    };

    // 🔄 Função de busca com rotação de chaves
    const getLiveVideoId = async () => {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${apiKeys[keyIndex]}`);
            
            // Tratamento de erro 403
            if(response.status === 403) {
                keyIndex = (keyIndex + 1) % apiKeys.length; // Troca de chave
                console.log(`Troca para chave ${keyIndex + 1}`);
                return null;
            }

            const data = await response.json();
            return data.items[0]?.id?.videoId || null;

        } catch(error) {
            console.error("Erro:", error);
            return null;
        }
    };

    // ✅ Atualização original com ajuste de chaves
    const updateLikes = async () => {
        try {
            const VIDEO_ID = await getLiveVideoId();
            
            if(!VIDEO_ID) return;

            const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${VIDEO_ID}&key=${apiKeys[keyIndex]}`);
            
            if(statsResponse.status === 403) {
                keyIndex = (keyIndex + 1) % apiKeys.length;
                return;
            }

            const statsData = await statsResponse.json();
            const likes = parseInt(statsData.items[0].statistics.likeCount) || 0;

            // ✅ Sua UI original
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

    // ✅ Seus intervalos originais
    setInterval(updateLikes, 10000);
    setInterval(rotateMessages, 5000);
    updateLikes();
    messages[0].classList.add('active');
});