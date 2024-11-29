import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS', 'GET'], // Specify allowed methods
  origin: '*', // Allow all origins (replace '*' with your domain for more security)
  credentials: true, // Allow credentials if needed
});

// Helper function to run middleware
function runCors(req, res, next) {
  cors(req, res, (result) => {
    if (result instanceof Error) {
      return res.status(500).json({ error: 'CORS middleware error' });
    }
    next(); // Continue to the handler if CORS passes
  });
}

// Function to generate fixed products
const getFixedProducts = (count) => {
  const productsr = [];
  const products = [
    { id: 1, name: "Wireless Headphones", price: 99.99, category: "Electronics" },
    { id: 2, name: "Running Shoes", price: 69.99, category: "Sports" },
    { id: 3, name: "Smart Watch", price: 129.99, category: "Wearable" },
    { id: 4, name: "Bluetooth Speaker", price: 49.99, category: "Electronics" },
    { id: 5, name: "Gaming Mouse", price: 39.99, category: "Gaming" },
    { id: 6, name: "Yoga Mat", price: 19.99, category: "Fitness" },
    { id: 7, name: "Backpack", price: 59.99, category: "Accessories" },
    { id: 8, name: "Cookware Set", price: 89.99, category: "Home" },
  ];

  return products;
};

// API handler
export default function handler(req, res) {
  // Run CORS middleware before anything else
  runCors(req, res, () => {
    if (req.method === 'GET') {
      // If the request is for an individual product (with an id)
      if (req.query.id) {
        const productId = parseInt(req.query.id, 10);
        const fixedProducts = getFixedProducts(1); // Generate 1 product

        const product = fixedProducts.find((prod) => prod.id === productId);

        if (product) {
          return res.status(200).json({ product });
        } else {
          return res.status(404).json({ error: 'Product not found' });
        }
      }

      // Parse the query parameter for the number of products (default to 5)
      const count = parseInt(req.query.count || "5", 10);

      // Generate fixed products
      const fixedProducts = getFixedProducts(count);

      // Respond with the products as JSON
      res.status(200).json({ products: fixedProducts });
    } else {
      // Handle unsupported methods
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  });
}
