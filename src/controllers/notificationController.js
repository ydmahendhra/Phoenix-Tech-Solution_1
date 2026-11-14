const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'admin') {
      filter.recipientRole = { $in: ['admin', 'all'] };
    } else {
      filter.recipientId = req.user.internId;
    }

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { $or: [{ notificationId: id }, { _id: id }] },
      { isRead: true }
    );
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'admin') {
      filter.recipientRole = { $in: ['admin', 'all'] };
    } else {
      filter.recipientId = req.user.internId;
    }
    await Notification.updateMany(filter, { isRead: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
