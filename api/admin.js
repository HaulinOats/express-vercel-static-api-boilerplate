export default async function handler(request, response) {
  const { pin, content } = request.body;
  if (pin === process.env.content_pin) {
    try {
      // nocache param prevents caching of json
      await fetch(`https://json.extendsclass.com/bin/070e0707707e?nocache=${new Date().getTime()}`, {
        method: "PUT",
        headers: {
          "Security-key": process.env.content_pin
        },
        body: JSON.stringify(content)
      });
      return response.json({ success: true });
    } catch (err) {
      return response.json({ error: "Error saving json. Contact administrator." });
    }
  } else {
    return response.json({ error: "Wrong pin" });
  }
}
