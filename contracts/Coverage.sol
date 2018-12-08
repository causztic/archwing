pragma solidity ^0.4.24;

library Coverage {
    struct Insurance {
        uint256 claimStatus; // 0 is unclaimed, 1 is claimed for delay, 2 is claimed for cancel
        bool    set;
    }

    struct TicketStatus {
        uint8 processStatus;  // 0 - pending, 1 - invalid, 2 - valid
        uint8 ticketType;     // 0 - single,  1 - round-trip
        uint8 flightStatus; // 0 - normal,  1 - delayed, 2 - cancelled
        uint256 lastUpdated;
        bool  set;
    }
}