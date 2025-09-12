"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Clock, DollarSign, CreditCard, AlertTriangle, User, FileText, Calendar, CheckCircle } from "lucide-react"

interface NotificationDetailModalProps {
  notification: any
  isOpen: boolean
  onClose: () => void
  onMarkAsRead: (id: string) => void
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
}: NotificationDetailModalProps) {
  if (!notification) return null

  const getNotificationIcon = (category: string, type: string) => {
    switch (category) {
      case "service_expiry":
        return <Clock className="h-8 w-8 text-orange-500" />
      case "account_balance":
        return <DollarSign className="h-8 w-8 text-green-500" />
      case "payment":
        return <CreditCard className="h-8 w-8 text-blue-500" />
      default:
        return <AlertTriangle className="h-8 w-8 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "text-red-600 bg-red-50 border-red-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "success":
        return "text-green-600 bg-green-50 border-green-200"
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>
      case "medium":
        return <Badge variant="secondary">Medium Priority</Badge>
      case "low":
        return <Badge variant="outline">Low Priority</Badge>
      default:
        return null
    }
  }

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            {getNotificationIcon(notification.category, notification.type)}
            <div className="flex-1">
              <DialogTitle className="text-xl">{notification.title}</DialogTitle>
              <div className="flex items-center space-x-2 mt-2">
                {getPriorityBadge(notification.priority)}
                <Badge variant="outline" className="capitalize">
                  {notification.category.replace("_", " ")}
                </Badge>
                {notification.unread && (
                  <Badge variant="default" className="bg-blue-500">
                    Unread
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className={`p-4 rounded-lg border ${getTypeColor(notification.type)}`}>
          <DialogDescription className="text-base leading-relaxed">{notification.message}</DialogDescription>
        </div>

        {/* Notification Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Time</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">{notification.time}</p>
            </div>

            {notification.customerId && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Customer ID</span>
                </div>
                <p className="text-sm text-gray-600 ml-6">{notification.customerId}</p>
              </div>
            )}

            {notification.invoiceId && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Invoice</span>
                </div>
                <p className="text-sm text-gray-600 ml-6">{notification.invoiceId}</p>
              </div>
            )}

            {notification.expiryDate && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Expiry Date</span>
                </div>
                <p className="text-sm text-gray-600 ml-6">{notification.expiryDate}</p>
              </div>
            )}
          </div>

          {notification.daysRemaining !== undefined && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Days Remaining</span>
                <Badge variant={notification.daysRemaining <= 1 ? "destructive" : "secondary"} className="text-sm">
                  {notification.daysRemaining === 0
                    ? "Expires Today"
                    : notification.daysRemaining === 1
                      ? "Expires Tomorrow"
                      : notification.daysRemaining < 0
                        ? `Expired ${Math.abs(notification.daysRemaining)} days ago`
                        : `${notification.daysRemaining} days left`}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="space-x-2">
            {notification.unread && (
              <Button onClick={handleMarkAsRead} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Read
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
