export async function sendHallOfFameUserUpdate(userId: number, hofCreatorId: string) {
  try {
    const response = await fetch('https://halloffame.cs2.mtq.io/webhooks/citiescollective/user/updated', {
      method: 'POST',
      headers: {
        'Authorization': `CreatorID ${hofCreatorId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userId.toString()
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Hall of Fame webhook:', response.status, response.statusText);
      return false;
    }

    console.log('Hall of Fame webhook sent successfully for user:', userId);
    return true;
  } catch (error) {
    console.error('Error sending Hall of Fame webhook:', error);
    return false;
  }
} 