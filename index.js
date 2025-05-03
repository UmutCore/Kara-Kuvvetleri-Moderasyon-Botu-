const { Client, GatewayIntentBits, ActivityType, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

// Bot istatistikleri
let stats = {
  totalCalls: 0,
  lastCall: null
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: ['USER', 'CHANNEL'] // DM'ler için gerekli
});

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} aktif edildi!`);
  updateActivity();
});

// Aktivite durumunu güncelle
function updateActivity() {
  const activities = [
    { name: `${stats.totalCalls} denetim çağrısı`, type: ActivityType.Watching },
    { name: 'BTF Denetimleri', type: ActivityType.Competing }
  ];
  client.user.setActivity(activities[Math.floor(Math.random() * activities.length)]);
  
  // Her 10 dakikada bir güncelle
  setTimeout(updateActivity, 600000);
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // Sadece yetkililer komut kullanabilsin
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ Bu komutu kullanmak için denetim görevlisi yetkilerine sahip olmalısınız!',
      ephemeral: true
    });
  }

  if (interaction.commandName === 'denetim') {
    await handleDenetimCommand(interaction);
  }
});

async function handleDenetimCommand(interaction) {
  // Kullanıcıyı bilgilendir
  await interaction.deferReply({ ephemeral: true });
  
  const guild = interaction.guild;
  let successCount = 0;
  let failCount = 0;
  const failedUsers = [];

  try {
    // Sunucu üyelerini getir
    await guild.members.fetch();
    const members = guild.members.cache.filter(m => !m.user.bot && !m.user.system);

    // İlerleme durumu için mesaj
    const progressMsg = await interaction.followUp({
      content: `⏳ Denetim çağrıları gönderiliyor... (0/${members.size})`,
      ephemeral: true
    });

    // Her üye için işlem
    let processed = 0;
    for (const [_, member] of members) {
      try {
        // DM gönderme işlemi
        await sendDenetimDM(member);
        successCount++;
      } catch (error) {
        console.error(`[HATA] ${member.user.tag}:`, error.message);
        failCount++;
        failedUsers.push(member.user.tag);
      }
      
      processed++;
      // Her 5 gönderimde bir durum güncelle
      if (processed % 5 === 0 || processed === members.size) {
        await progressMsg.edit({
          content: `⏳ Denetim çağrıları gönderiliyor... (${processed}/${members.size})\n` +
                   `✅ Başarılı: ${successCount} | ❌ Başarısız: ${failCount}`
        });
      }
      
      // Rate limit koruması
      await delay(1500);
    }

    // İstatistikleri güncelle
    stats.totalCalls += successCount;
    stats.lastCall = new Date();

    // Sonuç raporu
    let resultMessage = `🎉 **Denetim çağrıları tamamlandı!**\n` +
                        `✅ Başarılı: ${successCount} kişi\n` +
                        `❌ Başarısız: ${failCount} kişi`;
    
    if (failedUsers.length > 0) {
      resultMessage += `\n\n**DM gönderilemeyenler:**\n${failedUsers.slice(0, 10).join('\n')}`;
      if (failedUsers.length > 10) resultMessage += `\n...ve ${failedUsers.length - 10} kişi daha`;
    }

    await interaction.followUp({
      content: resultMessage,
      ephemeral: true
    });

  } catch (error) {
    console.error('[CRITICAL]', error);
    await interaction.followUp({
      content: '❌ Denetim çağrıları gönderilirken kritik bir hata oluştu!',
      ephemeral: true
    });
  }
}

async function sendDenetimDM(member) {
  try {
    const dmChannel = await member.user.createDM();
    await dmChannel.send({
      content: `🔔 **BTF Resmi Denetim Çağrısı** 🔔\n\n` +
               `Merhaba ${member.user.username}!\n` +
               `Roblox sunucumuzda denetim başladı, branşını temsil etme zamanı!\n\n` +
               `🌍 Oyun Linki: ${process.env.ROBLOX_LINK || 'https://www.roblox.com/games/'}\n` +
               `⏰ Acil katılım bekleniyor!\n\n` +
               `Saygılarımızla,\nBTF Yönetim`
    });
    return true;
  } catch (error) {
    throw error;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🔑 Bot giriş yaptı!'))
  .catch(err => console.error('❌ Giriş hatası:', err));
