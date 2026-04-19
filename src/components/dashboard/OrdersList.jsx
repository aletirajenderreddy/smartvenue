import { motion, AnimatePresence } from 'framer-motion';

export default function OrdersList({ orders, onStatusChange, role }) {
  const statusFlow = ['pending', 'accepted', 'preparing', 'ready', 'completed'];

  const statusColors = {
    pending: 'bg-warning/20 text-warning',
    accepted: 'bg-primary/20 text-primary',
    preparing: 'bg-accent/20 text-accent',
    ready: 'bg-success/20 text-success',
    completed: 'bg-white/10 text-white/50'
  };

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {orders.length ? (
          orders.map((order) => {
            const nextStatus = statusFlow[Math.min(statusFlow.indexOf(order.status) + 1, statusFlow.length - 1)];
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                key={order.id} 
                className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:bg-white/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">Order {order.id.slice(0, 8)}</p>
                    <p className="text-sm text-white/60">₹{Number(order.total_price || 0).toFixed(2)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] || 'bg-white/10 text-white'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                    <span key={`${order.id}-${index}`} className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-white/70">
                      {item.name || item}
                    </span>
                  ))}
                </div>
                {role !== 'participant' && order.status !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => onStatusChange(order.id, nextStatus)}
                    className="mt-4 rounded-md bg-white/10 hover:bg-white/20 px-3 py-2 text-sm font-semibold text-white transition-colors"
                  >
                    Move to {nextStatus}
                  </button>
                ) : null}
              </motion.div>
            );
          })
        ) : (
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm font-medium text-white/50 py-4 text-center"
          >
            No live orders yet.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
