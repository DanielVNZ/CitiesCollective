import { NextResponse } from 'next/server';
import { db } from 'app/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    let dbStatus = 'unknown';
    let dbResponseTime = 0;
    
    try {
      const dbStartTime = Date.now();
      await db.execute(sql`SELECT 1`);
      dbResponseTime = Date.now() - dbStartTime;
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = 'disconnected';
      console.error('Database health check failed:', dbError);
    }
    
    const totalResponseTime = Date.now() - startTime;
    const isHealthy = dbStatus === 'connected';
    
    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: totalResponseTime,
      checks: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        environment: process.env.NODE_ENV || 'unknown',
      },
    };
    
    return NextResponse.json(
      healthData,
      { status: isHealthy ? 200 : 503 }
    );
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {
          database: { status: 'error' },
        }
      },
      { status: 503 }
    );
  }
} 