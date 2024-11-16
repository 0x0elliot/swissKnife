const MAX_ITERATIONS = 2;

const getTransactions = async (address) => {
  try {
    const response = await fetch(`https://eth.blockscout.com/api/v2/addresses/${address}/transactions`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};

const buildGraphData = async (initialAddress) => {
  const nodes = new Map(); // Use Map to prevent duplicate nodes
  const links = new Set(); // Use Set to prevent duplicate links
  const visitedAddresses = new Set();
  const queue = [initialAddress];

  while (queue.length > 0 && visitedAddresses.size < MAX_ITERATIONS) {
    const currentAddress = queue.shift();
    if (visitedAddresses.has(currentAddress)) continue;

    visitedAddresses.add(currentAddress);
    nodes.set(currentAddress, { id: currentAddress });

    try {
      const transactions = await getTransactions(currentAddress);
      console.log(`Transactions for ${currentAddress}:`, transactions);

      transactions.forEach((transaction) => {
        const fromAddress = transaction.from?.hash;
        const toAddress = transaction.to?.hash;

        // Skip invalid transactions
        if (!fromAddress || !toAddress) return;

        // Add nodes for both addresses
        if (!nodes.has(fromAddress)) {
          nodes.set(fromAddress, { id: fromAddress });
        }
        if (!nodes.has(toAddress)) {
          nodes.set(toAddress, { id: toAddress });
        }

        // Create a unique link identifier to prevent duplicates
        const linkId = `${fromAddress}-${toAddress}-${transaction.hash}`;
        links.add({
          id: linkId,
          source: fromAddress,
          target: toAddress,
          value: transaction.value,
          hash: transaction.hash,
          timestamp: transaction.timestamp,
          type: transaction.type,
          ...transaction,
        });

        // Add connected addresses to queue if not visited
        if (!visitedAddresses.has(fromAddress)) {
          queue.push(fromAddress);
        }
        if (!visitedAddresses.has(toAddress)) {
          queue.push(toAddress);
        }
      });

    } catch (error) {
      console.error(`Error processing transactions for ${currentAddress}:`, error);
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    links: Array.from(links)
  };
};

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const initialAddress = searchParams.get("address");

    if (!initialAddress) {
      return new Response(
        JSON.stringify({ error: "Missing 'address' parameter" }),
        { status: 400 }
      );
    }

    const graphData = await buildGraphData(initialAddress);
    return new Response(JSON.stringify(graphData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch graph data" }),
      { status: 500 }
    );
  }
}