pragma solidity ^0.4.24;

library Coverage {
  struct Insurance {
    bytes8 bookingNumber;
    byte   claimStatus; // 0 is unclaimed, 1 is claimed for delay, 2 is claimed for cancel
  }
}