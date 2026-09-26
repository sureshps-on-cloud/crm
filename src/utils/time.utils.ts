import moment from 'moment-timezone';
import { config } from '../config/config.js';

export class TimeUtils {
  private static readonly SAUDI_TIMEZONE = config.timezone;

  /**
   * Get current date and time in Saudi timezone
   */
  public static getSaudiTime(): Date {
    return moment.tz(this.SAUDI_TIMEZONE).toDate();
  }

  /**
   * Convert date to Saudi timezone
   */
  public static toSaudiTime(date: Date): Date {
    return moment(date).tz(this.SAUDI_TIMEZONE).toDate();
  }

  /**
   * Format date to Saudi timezone string
   */
  public static formatSaudiTime(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    return moment(date).tz(this.SAUDI_TIMEZONE).format(format);
  }

  /**
   * Get current timestamp in Saudi timezone
   */
  public static getSaudiTimestamp(): number {
    return moment.tz(this.SAUDI_TIMEZONE).valueOf();
  }

  /**
   * Check if date is in Saudi timezone
   */
  public static isSaudiTime(date: Date): boolean {
    const saudiMoment = moment.tz(date, this.SAUDI_TIMEZONE);
    return saudiMoment.format('Z') === moment.tz(this.SAUDI_TIMEZONE).format('Z');
  }
} 