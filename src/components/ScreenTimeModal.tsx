import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getAllowedWeeks, formatDateForDB, formatWeekForDisplay, getCurrentWeekStart } from '@/lib/date-utils';

interface ScreenTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ScreenTimeModal({ open, onOpenChange, onSuccess }: ScreenTimeModalProps) {
  const [totalHours, setTotalHours] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const allowedWeeks = getAllowedWeeks();

  useEffect(() => {
    if (open) {
      // Reset form and set default week to current week
      setTotalHours('');
      setSelectedWeek(formatDateForDB(getCurrentWeekStart()));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hours = parseFloat(totalHours);
    if (isNaN(hours) || hours < 0 || hours > 168) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a valid number of hours between 0 and 168.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedWeek) {
      toast({
        title: 'No week selected',
        description: 'Please select a week.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke('screen-entries', {
        body: {
          weekStartLocal: selectedWeek,
          totalHours: hours,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Screen time saved',
        description: `Successfully recorded ${hours} hours for the selected week.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving screen time:', error);
      toast({
        title: 'Error saving screen time',
        description: error.message || 'Failed to save screen time. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="screen-time-description">
        <DialogHeader>
          <DialogTitle>Add This Week's Screen Time</DialogTitle>
          <p id="screen-time-description" className="text-sm text-muted-foreground">
            Enter your total screen time for the selected week. You can only submit data for the current week and the two previous weeks.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="total-hours">Total screen time (hours)</Label>
            <Input
              id="total-hours"
              type="number"
              min="0"
              max="168"
              step="0.1"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              placeholder="Enter hours (e.g., 25.5)"
              required
              disabled={isLoading}
              aria-describedby="hours-help"
            />
            <p id="hours-help" className="text-xs text-muted-foreground">
              Maximum 168 hours per week (24 hours × 7 days)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="week-selector">Week</Label>
            <Select
              value={selectedWeek}
              onValueChange={setSelectedWeek}
              required
              disabled={isLoading}
            >
              <SelectTrigger id="week-selector">
                <SelectValue placeholder="Select a week" />
              </SelectTrigger>
              <SelectContent>
                {allowedWeeks.map((week) => {
                  const weekKey = formatDateForDB(week);
                  return (
                    <SelectItem key={weekKey} value={weekKey}>
                      {formatWeekForDisplay(week)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}