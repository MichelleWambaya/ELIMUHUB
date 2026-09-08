import { supabase } from './supabase.js';

// Called the moment an order is confirmed paid, regardless of which
// payment path confirmed it (dev adapter, M-Pesa callback, or an admin
// manually confirming a till/QR payment). Keeping this in one place means
// all three paths credit balances and notify people identically.
export async function fulfillOrder(order) {
  await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id);

  await supabase.from('entitlements').insert({
    order_id: order.id,
    student_id: order.student_id,
    resource_id: order.resource_id,
  });

  const { data: resource } = await supabase
    .from('resources')
    .select('teacher_id, title')
    .eq('id', order.resource_id)
    .single();

  const { data: balance } = await supabase
    .from('teacher_balances')
    .select('*')
    .eq('teacher_id', resource.teacher_id)
    .maybeSingle();

  if (balance) {
    await supabase
      .from('teacher_balances')
      .update({ pending_kes: Number(balance.pending_kes) + Number(order.teacher_earnings_kes) })
      .eq('teacher_id', resource.teacher_id);
  } else {
    await supabase.from('teacher_balances').insert({
      teacher_id: resource.teacher_id,
      pending_kes: order.teacher_earnings_kes,
      available_kes: 0,
    });
  }

  await supabase.from('notifications').insert([
    { user_id: order.student_id, type: 'purchase_completed', message: `Payment confirmed for "${resource.title}".` },
    { user_id: resource.teacher_id, type: 'purchase_completed', message: `"${resource.title}" was purchased.` },
  ]);
}

export async function notifyAllAdmins({ type, message }) {
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  if (!admins?.length) return;

  await supabase.from('notifications').insert(admins.map((a) => ({ user_id: a.id, type, message })));
}
