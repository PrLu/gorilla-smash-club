'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export interface DropdownItem {
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  children?: DropdownItem[];
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Dropdown menu component with nested submenu support
 */
export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.onClick) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={clsx('relative', className)}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute z-50 mt-2 min-w-[200px] rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <div className="py-1">
              {items.map((item, index) => (
                <div key={index}>
                  {item.divider ? (
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  ) : (
                    <DropdownMenuItem item={item} onItemClick={handleItemClick} onClose={() => setIsOpen(false)} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownMenuItemProps {
  item: DropdownItem;
  onItemClick: (item: DropdownItem) => void;
  onClose: () => void;
}

function DropdownMenuItem({ item, onItemClick, onClose }: DropdownMenuItemProps) {
  const [showSubmenu, setShowSubmenu] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setShowSubmenu(!showSubmenu);
    } else if (item.href) {
      window.location.href = item.href;
      onClose();
    } else if (item.onClick) {
      onItemClick(item);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="flex-1">{item.label}</span>
        {hasChildren && (
          <svg
            className={clsx('h-4 w-4 transition-transform', showSubmenu && 'rotate-90')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {hasChildren && showSubmenu && (
        <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700">
          {item.children!.map((child, index) => (
            <DropdownMenuItem key={index} item={child} onItemClick={onItemClick} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

