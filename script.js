document.addEventListener('DOMContentLoaded', () => {
    // Configurações
    const API_KEYS = ["SUA_KEY_1", "SUA_KEY_2", "SUA_KEY_3"]; // 🔑 Suas keys
    const CHANNEL_ID = "SEU_CHANNEL_ID"; // ID do seu canal
    
    // Variáveis
    let meta = 100;
    let keyIndex = 0;
    let currentVideoId = null;

    // Verifica se está ao vivo
    const checkLive = async () => {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEYS[keyIndex]}`);
            
            if (!response.ok) {
                keyIndex = (keyIndex + 1) % API_KEYS.length; // Troca de key em caso de erro
                return;
            }

            const data = await response.json();
            currentVideoId = data.items[0]?.id?.videoId;
            if (currentVideoId) updateLikes(); // Se estiver ao vivo, atualiza likes
            
        } catch(error) {
            console.log("Erro ao verificar live:", error);
        }
    };

    // Atualiza os likes
    const updateLikes = async () => {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${currentVideoId}&key=${API_KEYS[keyIndex]}`);
            const data = await response.json();
            const likes = parseInt(data.items[0].statistics.likeCount) || 0;

            // Atualiza a interface
            document.getElementById("progressBar").style.width = `${(likes/meta)*100}%`;
            document.getElementById("likeText").textContent = `${likes.toString().padStart(5, '0')} / ${meta}`;

            // Checa se atingiu a meta
            if (likes >= meta) {
                meta += 100;
                document.querySelector("#messageBox .msg:last-child").innerHTML = 
                    `META: <img src="gemas-png.png" class="gem-glow gem-icon"
                        style="width:45px !important; height:45px !important; vertical-align:middle; margin-right:10px; display: inline-block;">
                    ${meta}`;
            }

        } catch(error) {
            console.log("Erro ao buscar likes:", error);
        }
    };

    // Feedback ao clicar na barra
    document.getElementById('progressBar').addEventListener('click', () => {
        const feedback = document.createElement('div');
        feedback.id = "live-feedback";
        feedback.textContent = "ATUALIZANDO...";
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
        checkLive(); // Força nova verificação
    });

    // Intervalos
    setInterval(checkLive, 30000); // Verifica a cada 30 segundos
    setInterval(updateLikes, 10000); // Atualiza likes a cada 10 segundos
});