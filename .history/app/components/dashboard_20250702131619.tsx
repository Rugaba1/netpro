"use client"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Customers",
      value: "10",
      color: "bg-blue-500",
      icon: (
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
          <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
          <div className="w-2 h-2 bg-white rounded-full opacity-40"></div>
        </div>
      ),
    },
    {
      title: "Total Packages",
      value: "6",
      color: "bg-red-500",
      icon: (
        <svg className="h-12 w-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
        </svg>
      ),
    },
    {
      title: "Total Products",
      value: "7",
      color: "bg-orange-500",
      icon: (
        <svg className="h-12 w-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" />
        </svg>
      ),
    },
    {
      title: "Reports",
      value: "0",
      color: "bg-green-500",
      icon: (
        <svg className="h-12 w-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Grid - Matching the Screenshot */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className={`${stat.color} rounded-lg shadow-lg overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white text-sm font-medium opacity-90">{stat.title}</div>
                </div>
                <div className="ml-4 flex items-center justify-center">{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
