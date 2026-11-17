export function purchaseComparison(items, offersByItem) {
  const suppliers = new Map();
  for (const item of items) for (const offer of offersByItem[item.id] || []) suppliers.set(offer.supplierId,offer.supplier);
  return [...suppliers].map(([id,name]) => {
    const lines = items.map(item => {
      const offer = (offersByItem[item.id] || []).find(o => o.supplierId === id);
      return {item,offer,complete:Boolean(offer?.available && Number(offer.availableQuantity) >= Number(item.quantity) && !offer.alternative)};
    });
    return {id,name,lines,complete:lines.every(l => l.complete),totalCents:lines.reduce((sum,l) => sum + (l.complete ? Number(l.offer.totalCents) : 0),0)};
  });
}
