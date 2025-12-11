import React from 'react';

interface WorkOrderNotificationProps {
    title: string;
    body: string;
    type?: string;
    work_order_id?: string;
    work_order_title?: string;
    old_status?: string;
    new_status?: string;
    url?: string;
    action_by_name?: string;
    asset_name?: string;
    staff_name?: string;
    priority?: string;
    due_date?: string;
}

export default function WorkOrderNotification({
    title,
    body,
    type,
    work_order_id,
    work_order_title,
    old_status,
    new_status,
    url,
    action_by_name,
    asset_name,
    staff_name,
    priority,
    due_date,
}: WorkOrderNotificationProps) {
    const getStatusColor = (status?: string) => {
        const statusMap: Record<string, string> = {
            '0': '#f59e0b', // Pending - amber
            '1': '#3b82f6', // Approved - blue
            '2': '#600433', // In Progress - primary brand color
            '3': '#10b981', // Completed - green
            '4': '#ef4444', // Rejected - red
        };
        return statusMap[status || ''] || '#6b7280';
    };

    const getStatusLabel = (status?: string) => {
        const statusMap: Record<string, string> = {
            '0': 'Pending',
            '1': 'Approved',
            '2': 'In Progress',
            '3': 'Completed',
            '4': 'Rejected',
        };
        return statusMap[status || ''] || 'Unknown';
    };

    const getPriorityColor = (priority?: string) => {
        const priorityMap: Record<string, string> = {
            '0': '#6b7280', // Low - gray
            '1': '#3b82f6', // Medium - blue
            '2': '#f59e0b', // High - amber
            '3': '#ef4444', // Urgent - red
        };
        return priorityMap[priority || ''] || '#6b7280';
    };

    const getPriorityLabel = (priority?: string) => {
        const priorityMap: Record<string, string> = {
            '0': 'Low',
            '1': 'Medium',
            '2': 'High',
            '3': 'Urgent',
        };
        return priorityMap[priority || ''] || 'Unknown';
    };

    // For SSR/email context, we'll use a placeholder that will be replaced server-side
    // The Mailable class will handle the full URL construction
    const fullUrl = url || '#';

    return (
        <div style={{ 
            fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
        }}>
            {/* Header with Brand Color */}
            <div style={{
                backgroundColor: '#600433',
                padding: '32px 40px',
                borderRadius: '8px 8px 0 0',
                textAlign: 'center',
            }}>
                <div style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.5px',
                    margin: 0,
                }}>
                    Asset Management System
                </div>
            </div>

            {/* Main Content Card */}
            <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '40px',
            }}>
                {/* Title Section */}
                <div style={{
                    marginBottom: '32px',
                    paddingBottom: '24px',
                    borderBottom: '2px solid #f3f4f6',
                }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#111827',
                        margin: '0 0 12px 0',
                        lineHeight: '1.2',
                    }}>
                        {title}
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        lineHeight: '1.6',
                        color: '#6b7280',
                        margin: 0,
                    }}>
                        {body}
                    </p>
                </div>

                {/* Work Order Details Card */}
                {work_order_id && (
                    <div style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '24px',
                        marginBottom: '24px',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '16px',
                        }}>
                            <div style={{
                                width: '4px',
                                height: '24px',
                                backgroundColor: '#600433',
                                borderRadius: '2px',
                                marginRight: '12px',
                            }} />
                            <h2 style={{
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#111827',
                                margin: 0,
                            }}>
                                Work Order Details
                            </h2>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#6b7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    marginBottom: '4px',
                                }}>
                                    Work Order ID
                                </div>
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    color: '#600433',
                                }}>
                                    #{work_order_id}
                                </div>
                            </div>

                            {work_order_title && (
                                <div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px',
                                    }}>
                                        Title
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        color: '#111827',
                                    }}>
                                        {work_order_title}
                                    </div>
                                </div>
                            )}

                            {priority && (
                                <div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px',
                                    }}>
                                        Priority
                                    </div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        backgroundColor: getPriorityColor(priority),
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                    }}>
                                        {getPriorityLabel(priority)}
                                    </span>
                                </div>
                            )}

                            {due_date && (
                                <div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px',
                                    }}>
                                        Due Date
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        color: '#111827',
                                    }}>
                                        {due_date}
                                    </div>
                                </div>
                            )}

                            {asset_name && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px',
                                    }}>
                                        Asset
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        color: '#111827',
                                    }}>
                                        {asset_name}
                                    </div>
                                </div>
                            )}

                            {staff_name && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#6b7280',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px',
                                    }}>
                                        Assigned To
                                    </div>
                                    <div style={{
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        color: '#111827',
                                    }}>
                                        {staff_name}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Status Change Section */}
                {old_status && new_status && old_status !== new_status && (
                    <div style={{
                        backgroundColor: '#fef3c7',
                        border: `2px solid ${getStatusColor(new_status)}`,
                        borderRadius: '8px',
                        padding: '24px',
                        marginBottom: '24px',
                        borderLeft: `6px solid ${getStatusColor(new_status)}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '16px',
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: getStatusColor(new_status),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                            }}>
                                <span style={{ color: '#ffffff', fontSize: '18px' }}>→</span>
                            </div>
                            <h3 style={{
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#111827',
                                margin: 0,
                            }}>
                                Status Update
                            </h3>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    backgroundColor: getStatusColor(old_status),
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                }}>
                                    {getStatusLabel(old_status)}
                                </span>
                                <span style={{
                                    fontSize: '20px',
                                    color: '#6b7280',
                                }}>→</span>
                                <span style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    backgroundColor: getStatusColor(new_status),
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                }}>
                                    {getStatusLabel(new_status)}
                                </span>
                            </div>
                        </div>

                        {action_by_name && (
                            <div style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid #e5e7eb',
                            }}>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    marginBottom: '4px',
                                }}>
                                    Action performed by
                                </div>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: '#111827',
                                }}>
                                    {action_by_name}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Single Status Display */}
                {new_status && !old_status && (
                    <div style={{
                        backgroundColor: '#f9fafb',
                        border: `2px solid ${getStatusColor(new_status)}`,
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '24px',
                        borderLeft: `6px solid ${getStatusColor(new_status)}`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#6b7280',
                                    marginBottom: '8px',
                                }}>
                                    Current Status
                                </div>
                                <span style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    backgroundColor: getStatusColor(new_status),
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                }}>
                                    {getStatusLabel(new_status)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {url && url !== '#' && (
                    <div style={{
                        textAlign: 'center',
                        marginTop: '32px',
                        marginBottom: '32px',
                    }}>
                        <a
                            href={fullUrl}
                            style={{
                                display: 'inline-block',
                                padding: '14px 32px',
                                backgroundColor: '#600433',
                                color: '#ffffff',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '16px',
                                letterSpacing: '0.3px',
                                boxShadow: '0 4px 6px -1px rgba(96, 4, 51, 0.1), 0 2px 4px -1px rgba(96, 4, 51, 0.06)',
                            }}
                        >
                            View Work Order →
                        </a>
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: '32px',
                    paddingTop: '24px',
                    borderTop: '1px solid #e5e7eb',
                }}>
                    <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#6b7280',
                        margin: '0 0 8px 0',
                    }}>
                        This is an automated notification from the Asset Management System.
                    </p>
                    <p style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#9ca3af',
                        margin: 0,
                    }}>
                        Please do not reply to this email. For inquiries, please contact your system administrator.
                    </p>
                </div>
            </div>

            {/* Bottom Branding */}
            <div style={{
                textAlign: 'center',
                padding: '24px',
                fontSize: '12px',
                color: '#9ca3af',
            }}>
                <p style={{ margin: 0 }}>
                    © {new Date().getFullYear()} Asset Management System. All rights reserved.
                </p>
            </div>
        </div>
    );
}
