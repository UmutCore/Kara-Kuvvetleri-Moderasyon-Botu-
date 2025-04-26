const { REST, Routes, PermissionFlagsBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const commands = [
  {
    name: 'denetim',
    description: 'Sunucudaki üyelere denetim çağrısı gönderir',
    default_member_permissions: PermissionFlagsBits.Administrator.toString(),
    options: [
      {
        name: 'test',
        description: 'Sadece 5 kişiye test mesajı gönder',
        type: 5, // Boolean
        required: false
      }
    ]
  }
];

(async () => {
  try {
    console.log('🔄 Komutlar kaydediliyor...');

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log(`✅ ${data.length} komut başarıyla kaydedildi!`);
  } catch (error) {
    console.error('❌ Komut kayıt hatası:', error);
  }
})();