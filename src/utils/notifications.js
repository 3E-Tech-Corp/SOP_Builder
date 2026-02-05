// Notification preview / simulation utilities

export function formatNotification(notification, context) {
  const { objectName, objectId, fromStatus, toStatus, action, actor, role } = context;
  const vars = {
    '{objectName}': objectName || 'Unknown',
    '{objectId}': objectId || 'N/A',
    '{fromStatus}': fromStatus || 'N/A',
    '{toStatus}': toStatus || 'N/A',
    '{status}': toStatus || fromStatus || 'N/A',
    '{action}': action || 'N/A',
    '{actor}': actor || 'Test User',
    '{role}': role || 'N/A',
    '{timestamp}': new Date().toLocaleString(),
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
      subject: `${objectName} → ${toStatus}`,
      body: template,
      formatted: `${icon} ${channelName} to [${recipientName}]: ${template}`,
    };
  });
}

export function generateNotificationPreviews(notifications, context) {
  const previews = [];
  for (const n of notifications) {
    const ctx = {
      ...context,
      fromStatus: n.context?.fromStatus || n.context?.nodeLabel || context.fromStatus || 'N/A',
      toStatus: n.context?.toStatus || n.context?.nodeLabel || context.toStatus || 'N/A',
      action: n.context?.action || context.action || 'Transition',
    };
    const formatted = formatNotification(n, ctx);
    previews.push(...formatted);
  }
  return previews;
}
