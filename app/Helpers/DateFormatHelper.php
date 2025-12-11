<?php

declare(strict_types=1);

namespace App\Helpers;

final class DateFormatHelper
{
    /**
     * Convert PHP date format to JavaScript date format for react-datepicker
     */
    public static function phpToJsFormat(string $phpFormat): string
    {
        $replacements = [
            // Year
            'Y' => 'yyyy',      // Full year (4 digits)
            'y' => 'yy',        // Two digit year
            'o' => 'YYYY',      // ISO-8601 week-numbering year
            
            // Month
            'F' => 'MMMM',      // Full month name
            'M' => 'MMM',       // Short month name
            'm' => 'MM',        // Month with leading zeros
            'n' => 'M',         // Month without leading zeros
            
            // Day
            'l' => 'EEEE',      // Full day name
            'D' => 'EEE',       // Short day name
            'd' => 'dd',        // Day with leading zeros
            'j' => 'd',         // Day without leading zeros
            
            // Time
            'H' => 'HH',        // 24-hour with leading zeros
            'h' => 'hh',        // 12-hour with leading zeros
            'G' => 'H',         // 24-hour without leading zeros
            'g' => 'h',         // 12-hour without leading zeros
            'i' => 'mm',        // Minutes
            's' => 'ss',        // Seconds
            'A' => 'aa',        // Uppercase AM/PM
            'a' => 'a',         // Lowercase am/pm
            
            // Other
            'S' => '',          // Ordinal suffix (st, nd, rd, th)
            'L' => '',          // Leap year
            't' => '',          // Days in month
        ];
        
        $result = '';
        $length = strlen($phpFormat);
        $i = 0;
        
        while ($i < $length) {
            $char = $phpFormat[$i];
            
            // Check if this character is escaped
            if ($char === '\\' && $i + 1 < $length) {
                // Add the escaped character as-is
                $result .= "'" . $phpFormat[$i + 1] . "'";
                $i += 2;
                continue;
            }
            
            // Check if we have a replacement for this character
            if (isset($replacements[$char])) {
                $result .= $replacements[$char];
            } else {
                $result .= $char;
            }
            
            $i++;
        }
        
        return $result;
    }
}

