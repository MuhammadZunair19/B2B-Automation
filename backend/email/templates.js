function replaceMergeTags(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export const templates = {
  warmup1: {
    subject: 'Salam from {senderName} - Quick thought on {restaurant}',
    text: `Assalam o Alaikum {ownerName},

I came across {restaurant} while looking at restaurants in {area}, and your reviews stood out.

I am {senderName}, a web developer who helps local restaurants get discovered online. No pitch here, just a genuine hello. I will be in touch soon.

Jazak Allah Khair,
{senderName}
{senderPhone}`,
    html: `<p>Assalam o Alaikum {ownerName},</p>
<p>I came across <strong>{restaurant}</strong> while looking at restaurants in {area}, and your reviews stood out.</p>
<p>I am {senderName}, a web developer who helps local restaurants get discovered online. No pitch here, just a genuine hello. I will be in touch soon.</p>
<p>Jazak Allah Khair,<br />{senderName}<br />{senderPhone}</p>`
  },
  warmup2: {
    subject: '3 things customers search before visiting {restaurant}',
    text: `Salam {ownerName},

Most customers check a restaurant online before visiting. The top things they look for are menu, location, and photos.

If you ever want, I can show you a simple website idea for {restaurant}.

Allah Hafiz,
{senderName}`,
    html: `<p>Salam {ownerName},</p>
<p>Most customers check a restaurant online before visiting. The top things they look for are menu, location, and photos.</p>
<p>If you ever want, I can show you a simple website idea for <strong>{restaurant}</strong>.</p>
<p>Allah Hafiz,<br />{senderName}</p>`
  },
  permission: {
    subject: 'Would it be okay to share something with you?',
    text: `Salam {ownerName},

I genuinely think a simple website could help {restaurant} get discovered by more customers in {area}.

Would you be open to a 10-minute call this week? If yes, reply with a time that works for you.

Jazak Allah Khair,
{senderName}
{senderPhone}`,
    html: `<p>Salam {ownerName},</p>
<p>I genuinely think a simple website could help <strong>{restaurant}</strong> get discovered by more customers in {area}.</p>
<p>Would you be open to a 10-minute call this week? If yes, reply with a time that works for you.</p>
<p>Jazak Allah Khair,<br />{senderName}<br />{senderPhone}</p>`
  }
};

export function renderTemplate(templateKey, contact) {
  const template = templates[templateKey];

  if (!template) {
    throw new Error(`Unknown template key: ${templateKey}`);
  }

  const vars = {
    ownerName: contact.owner_name || 'there',
    restaurant: contact.name || 'your restaurant',
    area: contact.area || process.env.DEFAULT_AREA || 'your area',
    senderName: process.env.SENDER_NAME || 'Your Name',
    senderPhone: process.env.DEFAULT_FROM_PHONE || ''
  };

  return {
    subject: replaceMergeTags(template.subject, vars),
    text: replaceMergeTags(template.text, vars),
    html: replaceMergeTags(template.html, vars)
  };
}
