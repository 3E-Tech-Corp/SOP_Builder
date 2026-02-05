// Notification preview/simulation utilities

export function formatNotification(notification, objectName, fromStatus, toStatus, action) {
  const vars = {
    '{objectName}': objectName || 'Unknown',
    '{fromStatus}': fromStatus || 'N/A',
    '{toStatus}': toStatus || 'N/A',
    '{action}': action || 'N/A',
    '{timestamp}': new Date().toLocaleString(),
    '{actor}': 'Test User',
  };

  let template = notification.template || 'Status changed to {toStatus}';
  for (const [key, value] of Object.entries(vars)) {
    template = template.replaceAll(key, value);
  }

  const channels = notification.channels || ['email'];
  const recipient = notification.recipient || 'owner';

  return channels.map(channel => {
    const icon = channel === 'email' ? '📧' : channel === 'sms' ? '📱' : '🔔';
    const channelName = channel.charAt(0).toUpperCase() + channel.slice(1);
    const recipientName = recipient.charAt(0).toUpperCase() + recipient.slice(1);

    return {
      icon,
      channel: channelName,
      recipient: recipientName,
      subject: `${objectName} moved to ${toStatus}`,
      body: template,
      formatted: `${icon} ${channelName} to [${recipientName}]: ${objectName} → ${toStatus} — ${template}`,
    };
  });
}

export function generateNotificationPreviews(notifications, objectName) {
  const previews = [];
  for (const n of notifications) {
    const fromStatus = n.context?.fromStatus || n.context?.nodeLabel || 'N/A';
    const toStatus = n.context?.toStatus || n.context?.nodeLabel || 'N/A';
    const action = n.context?.action || 'Transition';
    const formatted = formatNotification(n, objectName, fromStatus, toStatus, action);
    previews.push(...formatted);
  }
  return previews;
}
