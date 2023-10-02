export default function handler(request, response) {
  const { message } = request.body;
  return response.json({ message });
}
